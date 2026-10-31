import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { isValidSubscriptionTransition } from '@brightloop/shared';
import { addMonths, addDays } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number; pageSize?: number; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
    status?: string; customerId?: string;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, customerId } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.SubscriptionWhereInput = {
      ...(status && { status: status as SubscriptionStatus }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { customer: { contactName: { contains: search, mode: 'insensitive' } } },
          { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where, skip, take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, contactName: true, companyName: true, customerNumber: true } },
          lines: { include: { plan: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
  }

  async findOne(id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { plan: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        quotation: true,
      },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async create(dto: CreateSubscriptionDto, actorId: string) {
    // Calculate MRR from lines
    let totalMonthlyPaise = 0;
    for (const line of dto.lines) {
      totalMonthlyPaise += line.unitPricePaise * (line.quantity || 1);
    }

    const billingInterval = (dto.billingInterval as any) || 'MONTHLY';
    // Normalize to monthly for MRR
    const intervalMultiplier: Record<string, number> = {
      MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12,
    };
    const months = intervalMultiplier[billingInterval] || 1;
    const mrrPaise = Math.round(totalMonthlyPaise / months);

    const sub = await this.prisma.subscription.create({
      data: {
        customerId: dto.customerId,
        quotationId: dto.quotationId,
        billingInterval,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        mrrPaise,
        status: SubscriptionStatus.DRAFT,
        lines: {
          create: dto.lines.map((l) => ({
            planId: l.planId,
            description: l.description,
            quantity: l.quantity || 1,
            unitPricePaise: l.unitPricePaise,
          })),
        },
      },
      include: { lines: { include: { plan: true } }, customer: true },
    });

    await this.audit.log({ actorId, action: 'CREATE', entity: 'Subscription', entityId: sub.id });
    return sub;
  }

  async updateStatus(id: string, dto: UpdateSubscriptionStatusDto, actorId: string) {
    const sub = await this.findOne(id);
    const newStatus = dto.status as SubscriptionStatus;

    if (!isValidSubscriptionTransition(sub.status as any, newStatus as any)) {
      throw new BadRequestException(
        `Invalid transition from ${sub.status} to ${newStatus}`,
      );
    }

    const updateData: Prisma.SubscriptionUpdateInput = { status: newStatus };
    const now = new Date();

    switch (newStatus) {
      case SubscriptionStatus.ACTIVE:
        updateData.startDate = sub.startDate || now;
        updateData.currentPeriodStart = now;
        updateData.currentPeriodEnd = this.getNextPeriodEnd(now, sub.billingInterval);
        updateData.nextBillingDate = this.getNextPeriodEnd(now, sub.billingInterval);
        updateData.pausedAt = null;
        break;
      case SubscriptionStatus.PAUSED:
        updateData.pausedAt = now;
        break;
      case SubscriptionStatus.CANCELLED:
        updateData.cancelledAt = now;
        updateData.cancelReason = dto.cancelReason;
        break;
      case SubscriptionStatus.CLOSED:
        updateData.endDate = now;
        break;
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { lines: { include: { plan: true } }, customer: true },
    });

    await this.audit.log({
      actorId,
      action: 'STATUS_CHANGE',
      entity: 'Subscription',
      entityId: id,
      metadata: { from: sub.status, to: newStatus, cancelReason: dto.cancelReason },
    });

    return updated;
  }

  private getNextPeriodEnd(from: Date, interval: string): Date {
    switch (interval) {
      case 'MONTHLY': return addMonths(from, 1);
      case 'QUARTERLY': return addMonths(from, 3);
      case 'HALF_YEARLY': return addMonths(from, 6);
      case 'YEARLY': return addMonths(from, 12);
      default: return addMonths(from, 1);
    }
  }
}
