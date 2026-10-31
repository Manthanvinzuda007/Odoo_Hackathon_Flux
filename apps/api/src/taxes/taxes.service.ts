import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findAll(params: { page?: number; pageSize?: number; search?: string; isActive?: boolean }) {
    const { page = 1, pageSize = 50, search, isActive } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.TaxWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.tax.findMany({ where, skip, take: pageSize, orderBy: { name: 'asc' } }),
      this.prisma.tax.count({ where }),
    ]);
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
  }

  async findOne(id: string) {
    const tax = await this.prisma.tax.findUnique({ where: { id } });
    if (!tax) throw new NotFoundException('Tax not found');
    return tax;
  }

  async create(dto: CreateTaxDto, actorId: string) {
    const tax = await this.prisma.tax.create({
      data: { name: dto.name, rate: dto.rate, type: (dto.type as any) || 'GST' },
    });
    await this.audit.log({ actorId, action: 'CREATE', entity: 'Tax', entityId: tax.id });
    return tax;
  }

  async update(id: string, dto: UpdateTaxDto, actorId: string) {
    await this.findOne(id);
    const tax = await this.prisma.tax.update({
      where: { id },
      data: { name: dto.name, rate: dto.rate, type: dto.type as any, isActive: dto.isActive },
    });
    await this.audit.log({ actorId, action: 'UPDATE', entity: 'Tax', entityId: id, metadata: { changes: dto } });
    return tax;
  }
}
