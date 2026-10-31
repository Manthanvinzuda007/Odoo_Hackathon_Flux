import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findAll(params: { page?: number; pageSize?: number; search?: string; isActive?: boolean }) {
    const { page = 1, pageSize = 20, search, isActive } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.DiscountWhereInput = {
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

  async findOne(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async create(dto: CreateDiscountDto, actorId: string) {
    const discount = await this.prisma.discount.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        type: dto.type as any,
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

  async update(id: string, dto: UpdateDiscountDto, actorId: string) {
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
  async redeemDiscount(
    discountCode: string,
    customerId: string,
    purchaseAmountPaise: number,
  ): Promise<{ discountId: string; discountAmountPaise: number }> {
    return this.prisma.$transaction(async (tx) => {
      // Lock the discount row
      const discounts = await tx.$queryRaw<Array<{
        id: string; type: string; value_paise: number | null; percentage: number | null;
        min_purchase_paise: number | null; max_usage: number | null;
        max_per_customer: number | null; current_usage: number;
        starts_at: Date | null; ends_at: Date | null; is_active: boolean;
      }>>`
        SELECT * FROM discounts WHERE code = ${discountCode.toUpperCase()} FOR UPDATE
      `;

      const discount = discounts[0];
      if (!discount || !discount.is_active) {
        throw new BadRequestException('Invalid or inactive discount code');
      }

      const now = new Date();
      if (discount.starts_at && now < discount.starts_at) {
        throw new BadRequestException('Discount is not yet active');
      }
      if (discount.ends_at && now > discount.ends_at) {
        throw new BadRequestException('Discount has expired');
      }
      if (discount.max_usage !== null && discount.current_usage >= discount.max_usage) {
        throw new BadRequestException('Discount usage limit reached');
      }
      if (discount.min_purchase_paise !== null && purchaseAmountPaise < discount.min_purchase_paise) {
        throw new BadRequestException('Minimum purchase amount not met');
      }

      // Check per-customer limit
      if (discount.max_per_customer !== null) {
        const customerRedemptions = await tx.discountRedemption.count({
          where: { discountId: discount.id, customerId },
        });
        if (customerRedemptions >= discount.max_per_customer) {
          throw new BadRequestException('Per-customer usage limit reached');
        }
      }

      // Calculate discount amount
      let discountAmountPaise: number;
      if (discount.type === 'PERCENTAGE' && discount.percentage !== null) {
        discountAmountPaise = Math.round((purchaseAmountPaise * discount.percentage) / 10000);
      } else if (discount.type === 'FIXED' && discount.value_paise !== null) {
        discountAmountPaise = discount.value_paise;
      } else {
        throw new BadRequestException('Invalid discount configuration');
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
}
