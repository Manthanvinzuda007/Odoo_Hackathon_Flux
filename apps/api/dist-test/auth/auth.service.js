"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    config;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async login(dto, ipAddress, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is temporarily locked. Please try again later.');
        }
        // Verify password
        const isValid = await argon2.verify(user.passwordHash, dto.password);
        if (!isValid) {
            // Increment failed login count
            const failedCount = user.failedLoginCount + 1;
            const updates = { failedLoginCount: failedCount };
            if (failedCount >= MAX_FAILED_ATTEMPTS) {
                updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
                this.logger.warn(`Account locked for user ${user.email} after ${failedCount} failed attempts`);
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: updates,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Reset failed login count and update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginCount: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });
        // Generate tokens
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        // Audit log
        await this.prisma.auditLog.create({
            data: {
                actorId: user.id,
                action: 'LOGIN',
                entity: 'User',
                entityId: user.id,
                ipAddress: ipAddress,
                userAgent: userAgent,
            },
        });
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: client_1.UserRole.CUSTOMER,
            },
        });
        return { id: user.id, email: user.email };
    }
    async refreshTokens(refreshTokenValue) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshTokenValue },
            include: { user: true },
        });
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (tokenRecord.isRevoked) {
            // Token reuse detected — revoke entire family
            this.logger.warn(`Refresh token reuse detected for family ${tokenRecord.family}. Revoking all tokens in family.`);
            await this.prisma.refreshToken.updateMany({
                where: { family: tokenRecord.family },
                data: { isRevoked: true },
            });
            throw new common_1.UnauthorizedException('Token reuse detected. All sessions revoked.');
        }
        if (tokenRecord.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        if (!tokenRecord.user.isActive) {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        // Revoke current token (rotation)
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isRevoked: true },
        });
        // Generate new token pair
        const tokens = await this.generateTokens({
            sub: tokenRecord.user.id,
            email: tokenRecord.user.email,
            role: tokenRecord.user.role,
        }, tokenRecord.family);
        return tokens;
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        // Always return success to prevent email enumeration
        if (!user)
            return;
        // Invalidate existing tokens
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });
        // TODO: Send email via EmailService
        this.logger.log(`Password reset token generated for ${user.email}: ${token}`);
    }
    async resetPassword(dto) {
        const tokenRecord = await this.prisma.passwordResetToken.findUnique({
            where: { token: dto.token },
        });
        if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const passwordHash = await argon2.hash(dto.newPassword);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: tokenRecord.userId },
                data: {
                    passwordHash,
                    failedLoginCount: 0,
                    lockedUntil: null,
                },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
            // Revoke all refresh tokens
            this.prisma.refreshToken.updateMany({
                where: { userId: tokenRecord.userId },
                data: { isRevoked: true },
            }),
        ]);
    }
    async logout(userId, refreshTokenValue) {
        if (refreshTokenValue) {
            // Revoke specific token family
            const tokenRecord = await this.prisma.refreshToken.findUnique({
                where: { token: refreshTokenValue },
            });
            if (tokenRecord) {
                await this.prisma.refreshToken.updateMany({
                    where: { family: tokenRecord.family },
                    data: { isRevoked: true },
                });
            }
        }
        else {
            // Revoke all
            await this.prisma.refreshToken.updateMany({
                where: { userId },
                data: { isRevoked: true },
            });
        }
        await this.prisma.auditLog.create({
            data: {
                actorId: userId,
                action: 'LOGOUT',
                entity: 'User',
                entityId: userId,
            },
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                customer: {
                    select: {
                        id: true,
                        customerNumber: true,
                        companyName: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return user;
    }
    async generateTokens(payload, family) {
        const tokenFamily = family || (0, crypto_1.randomBytes)(16).toString('hex');
        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
        });
        const refreshTokenValue = (0, crypto_1.randomBytes)(40).toString('hex');
        const refreshExpiryMs = this.parseExpiry(this.config.get('JWT_REFRESH_EXPIRY', '7d'));
        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: payload.sub,
                family: tokenFamily,
                expiresAt: new Date(Date.now() + refreshExpiryMs),
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenValue,
        };
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000; // default 7d
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map