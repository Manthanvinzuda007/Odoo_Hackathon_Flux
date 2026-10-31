import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number; pageSize?: number; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc'; isActive?: boolean;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { variants: true, _count: { select: { plans: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true, plans: { where: { deletedAt: null } } },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, actorId: string) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        variants: dto.variants ? {
          create: dto.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            pricePaise: v.pricePaise,
            currency: v.currency || 'INR',
            billingInterval: (v.billingInterval as Prisma.EnumBillingIntervalFieldUpdateOperationsInput['set']) || 'MONTHLY',
          })),
        } : undefined,
      },
      include: { variants: true },
    });

    await this.audit.log({ actorId, action: 'CREATE', entity: 'Product', entityId: product.id });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { name: dto.name, description: dto.description, isActive: dto.isActive },
      include: { variants: true },
    });
    await this.audit.log({ actorId, action: 'UPDATE', entity: 'Product', entityId: id, metadata: { changes: dto } });
    return product;
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'Product', entityId: id });
  }
}
