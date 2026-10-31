import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { UserRole } from '@prisma/client';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenPair & { user: { id: string; email: string; firstName: string; lastName: string; role: UserRole } }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Please try again later.',
      );
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      // Increment failed login count
      const failedCount = user.failedLoginCount + 1;
      const updates: Record<string, unknown> = { failedLoginCount: failedCount };

      if (failedCount >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        this.logger.warn(`Account locked for user ${user.email} after ${failedCount} failed attempts`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      throw new UnauthorizedException('Invalid credentials');
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

  async register(dto: RegisterDto): Promise<{ id: string; email: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
      },
    });

    return { id: user.id, email: user.email };
  }

  async refreshTokens(refreshTokenValue: string): Promise<TokenPair> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.isRevoked) {
      // Token reuse detected — revoke entire family
      this.logger.warn(
        `Refresh token reuse detected for family ${tokenRecord.family}. Revoking all tokens in family.`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { family: tokenRecord.family },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Token reuse detected. All sessions revoked.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Revoke current token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Generate new token pair
    const tokens = await this.generateTokens(
      {
        sub: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      },
      tokenRecord.family,
    );

    return tokens;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    // Invalidate existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
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

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
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

  async logout(userId: string, refreshTokenValue?: string): Promise<void> {
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
    } else {
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

  async getProfile(userId: string) {
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

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async generateTokens(
    payload: JwtPayload,
    family?: string,
  ): Promise<TokenPair> {
    const tokenFamily = family || randomBytes(16).toString('hex');

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshTokenValue = randomBytes(40).toString('hex');

    const refreshExpiryMs = this.parseExpiry(
      this.config.get('JWT_REFRESH_EXPIRY', '7d'),
    );

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

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

    const value = parseInt(match[1]!, 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
