import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, QuotationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/services/sequence.service';
import { AuditService } from '../common/services/audit.service';
import { isValidQuotationTransition } from '@brightloop/shared';
import { CreateQuotationDto } from './dto/quotation.dto';

@Injectable()
export class QuotationsService {
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
    status?: string;
    customerId?: string;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.QuotationWhereInput = {
      ...(status && { status: status as QuotationStatus }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { quotationNumber: { contains: search, mode: 'insensitive' } },
          { customer: { contactName: { contains: search, mode: 'insensitive' } } },
          { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              contactName: true,
              companyName: true,
              customerNumber: true,
              email: true,
            },
          },
          lines: {
            include: {
              tax: { select: { id: true, name: true, rate: true } },
            },
          },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
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
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        template: true,
        subscription: true,
        lines: {
          include: {
            tax: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID "${id}" not found`);
    }

    return quotation;
  }

  async create(dto: CreateQuotationDto, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${dto.customerId}" not found`);
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Quotation must have at least one line item');
    }

    let subtotalPaise = 0;
    let taxPaise = 0;

    const computedLines = dto.lines.map((line, index) => {
      const lineSubtotal = line.quantity * line.unitPricePaise;
      const lineTax = line.taxRate
        ? Math.round((lineSubtotal * line.taxRate) / 10000)
        : 0;
      const lineTotal = lineSubtotal + lineTax;

      subtotalPaise += lineSubtotal;
      taxPaise += lineTax;

      return {
        description: line.description,
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise,
        taxId: line.taxId || null,
        taxRate: line.taxRate || null,
        taxPaise: lineTax,
        subtotalPaise: lineSubtotal,
        totalPaise: lineTotal,
        sortOrder: index,
      };
    });

    const discountPaise = dto.discountPaise || 0;
    const totalPaise = Math.max(0, subtotalPaise + taxPaise - discountPaise);

    const quotationNumber = await this.sequence.getNext('QUO');

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: dto.customerId,
        templateId: dto.templateId || null,
        status: QuotationStatus.DRAFT,
        subtotalPaise,
        taxPaise,
        discountPaise,
        totalPaise,
        notes: dto.notes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        lines: {
          create: computedLines,
        },
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    await this.audit.log({
      entity: 'Quotation',
      entityId: quotation.id,
      action: 'CREATE',
      actorId: userId,
      metadata: { quotationNumber, totalPaise, customerId: dto.customerId },
    });

    return quotation;
  }

  async updateStatus(id: string, newStatus: QuotationStatus, userId?: string) {
    const quotation = await this.findOne(id);

    if (quotation.status === newStatus) {
      return quotation;
    }

    if (!isValidQuotationTransition(quotation.status as any, newStatus as any)) {
      throw new BadRequestException(
        `Invalid quotation transition from ${quotation.status} to ${newStatus}`,
      );
    }

    const updateData: Prisma.QuotationUpdateInput = {
      status: newStatus,
    };

    if (newStatus === QuotationStatus.SENT && !quotation.sentAt) {
      updateData.sentAt = new Date();
    } else if (newStatus === QuotationStatus.ACCEPTED) {
      updateData.acceptedAt = new Date();
    } else if (newStatus === QuotationStatus.REJECTED) {
      updateData.rejectedAt = new Date();
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { customer: true, lines: true },
    });

    await this.audit.log({
      entity: 'Quotation',
      entityId: id,
      action: 'UPDATE',
      actorId: userId,
      metadata: { status: { from: quotation.status, to: newStatus } },
    });

    return updated;
  }

  async acceptByCustomer(id: string, customerId: string, userId?: string) {
    const quotation = await this.findOne(id);

    if (quotation.customerId !== customerId) {
      throw new ForbiddenException('You cannot accept a quotation that belongs to another customer');
    }

    if (quotation.status !== QuotationStatus.SENT && quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException(
        `Quotation in status ${quotation.status} cannot be accepted`,
      );
    }

    if (quotation.expiresAt && new Date(quotation.expiresAt) < new Date()) {
      await this.prisma.quotation.update({
        where: { id },
        data: { status: QuotationStatus.EXPIRED },
      });
      throw new BadRequestException('This quotation has expired');
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: { customer: true, lines: true },
    });

    await this.audit.log({
      entity: 'Quotation',
      entityId: id,
      action: 'UPDATE',
      actorId: userId,
      metadata: { status: { from: quotation.status, to: QuotationStatus.ACCEPTED }, acceptedBy: customerId },
    });

    return updated;
  }
}
