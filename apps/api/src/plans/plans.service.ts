import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number; pageSize?: number; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
    isActive?: boolean; productId?: string;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'sortOrder', sortOrder = 'asc', isActive, productId } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.PlanWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where, skip, take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { product: { select: { id: true, name: true, sku: true } } },
      }),
      this.prisma.plan.count({ where }),
    ]);
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(dto: CreatePlanDto, actorId: string) {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        description: dto.description,
        productId: dto.productId,
        pricePaise: dto.pricePaise,
        currency: dto.currency || 'INR',
        billingInterval: (dto.billingInterval as any) || 'MONTHLY',
        trialDays: dto.trialDays || 0,
        features: dto.features || [],
        isPublic: dto.isPublic ?? true,
        sortOrder: dto.sortOrder || 0,
      },
      include: { product: true },
    });
    await this.audit.log({ actorId, action: 'CREATE', entity: 'Plan', entityId: plan.id });
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto, actorId: string) {
    await this.findOne(id);
    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        pricePaise: dto.pricePaise,
        billingInterval: dto.billingInterval as any,
        trialDays: dto.trialDays,
        features: dto.features,
        isActive: dto.isActive,
        isPublic: dto.isPublic,
        sortOrder: dto.sortOrder,
      },
      include: { product: true },
    });
    await this.audit.log({ actorId, action: 'UPDATE', entity: 'Plan', entityId: id, metadata: { changes: dto } });
    return plan;
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.plan.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'Plan', entityId: id });
  }
}
