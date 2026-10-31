"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DiscountsService = class DiscountsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, isActive } = params;
        const skip = (page - 1) * pageSize;
        const where = {
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.discount.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
            this.prisma.discount.count({ where }),
        ]);
        return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
    }
    async findOne(id) {
        const discount = await this.prisma.discount.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
        if (!discount)
            throw new common_1.NotFoundException('Discount not found');
        return discount;
    }
    async create(dto, actorId) {
        const discount = await this.prisma.discount.create({
            data: {
                name: dto.name,
                code: dto.code.toUpperCase(),
                type: dto.type,
                valuePaise: dto.valuePaise,
                percentage: dto.percentage,
                minPurchasePaise: dto.minPurchasePaise,
                maxUsage: dto.maxUsage,
                maxPerCustomer: dto.maxPerCustomer,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
            },
        });
        await this.audit.log({ actorId, action: 'CREATE', entity: 'Discount', entityId: discount.id });
        return discount;
    }
    async update(id, dto, actorId) {
        await this.findOne(id);
        const discount = await this.prisma.discount.update({
            where: { id },
            data: {
                name: dto.name,
                valuePaise: dto.valuePaise,
                percentage: dto.percentage,
                minPurchasePaise: dto.minPurchasePaise,
                maxUsage: dto.maxUsage,
                maxPerCustomer: dto.maxPerCustomer,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
                isActive: dto.isActive,
            },
        });
        await this.audit.log({ actorId, action: 'UPDATE', entity: 'Discount', entityId: id, metadata: { changes: dto } });
        return discount;
    }
    /**
     * Transaction-safe discount redemption using SELECT FOR UPDATE
     * to prevent race conditions on limited-use discounts.
     */
    async redeemDiscount(discountCode, customerId, purchaseAmountPaise) {
        return this.prisma.$transaction(async (tx) => {
            // Lock the discount row
            const discounts = await tx.$queryRaw `
        SELECT * FROM discounts WHERE code = ${discountCode.toUpperCase()} FOR UPDATE
      `;
            const discount = discounts[0];
            if (!discount || !discount.is_active) {
                throw new common_1.BadRequestException('Invalid or inactive discount code');
            }
            const now = new Date();
            if (discount.starts_at && now < discount.starts_at) {
                throw new common_1.BadRequestException('Discount is not yet active');
            }
            if (discount.ends_at && now > discount.ends_at) {
                throw new common_1.BadRequestException('Discount has expired');
            }
            if (discount.max_usage !== null && discount.current_usage >= discount.max_usage) {
                throw new common_1.BadRequestException('Discount usage limit reached');
            }
            if (discount.min_purchase_paise !== null && purchaseAmountPaise < discount.min_purchase_paise) {
                throw new common_1.BadRequestException('Minimum purchase amount not met');
            }
            // Check per-customer limit
            if (discount.max_per_customer !== null) {
                const customerRedemptions = await tx.discountRedemption.count({
                    where: { discountId: discount.id, customerId },
                });
                if (customerRedemptions >= discount.max_per_customer) {
                    throw new common_1.BadRequestException('Per-customer usage limit reached');
                }
            }
            // Calculate discount amount
            let discountAmountPaise;
            if (discount.type === 'PERCENTAGE' && discount.percentage !== null) {
                discountAmountPaise = Math.round((purchaseAmountPaise * discount.percentage) / 10000);
            }
            else if (discount.type === 'FIXED' && discount.value_paise !== null) {
                discountAmountPaise = discount.value_paise;
            }
            else {
                throw new common_1.BadRequestException('Invalid discount configuration');
            }
            // Never allow negative totals
            discountAmountPaise = Math.min(discountAmountPaise, purchaseAmountPaise);
            // Increment usage atomically
            await tx.discount.update({
                where: { id: discount.id },
                data: { currentUsage: { increment: 1 } },
            });
            // Record redemption
            await tx.discountRedemption.create({
                data: {
                    discountId: discount.id,
                    customerId,
                    amountPaise: discountAmountPaise,
                },
            });
            return { discountId: discount.id, discountAmountPaise };
        });
    }
};
exports.DiscountsService = DiscountsService;
exports.DiscountsService = DiscountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DiscountsService);
//# sourceMappingURL=discounts.service.js.map