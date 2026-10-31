import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/services/sequence.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { contactName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { customerNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { subscriptions: true, invoices: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { subscriptions: true, invoices: true, quotations: true } },
      },
    });
    if (!customer || customer.deletedAt) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto, actorId: string) {
    const customerNumber = await this.sequence.getNext('CUS');

    const customer = await this.prisma.customer.create({
      data: {
        customerNumber,
        contactName: dto.contactName,
        email: dto.email,
        companyName: dto.companyName,
        phone: dto.phone,
        gstin: dto.gstin,
        pan: dto.pan,
        billingAddress: dto.billingAddress as Prisma.InputJsonValue,
        shippingAddress: dto.shippingAddress as Prisma.InputJsonValue,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { customerNumber: customer.customerNumber },
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actorId: string) {
    const existing = await this.findOne(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        contactName: dto.contactName,
        email: dto.email,
        companyName: dto.companyName,
        phone: dto.phone,
        gstin: dto.gstin,
        pan: dto.pan,
        billingAddress: dto.billingAddress as Prisma.InputJsonValue,
        shippingAddress: dto.shippingAddress as Prisma.InputJsonValue,
        notes: dto.notes,
        isActive: dto.isActive,
      },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      metadata: { changes: dto },
    });

    return customer;
  }

  async softDelete(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
    });
  }
}
