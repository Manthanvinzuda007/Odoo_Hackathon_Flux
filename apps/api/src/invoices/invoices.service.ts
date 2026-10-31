import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/services/sequence.service';
import { AuditService } from '../common/services/audit.service';
import { isValidInvoiceTransition } from '@brightloop/shared';

interface CreateInvoiceLineInput {
  description: string;
  quantity: number;
  unitPricePaise: number;
  taxId?: string;
  taxRate?: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number; pageSize?: number; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
    status?: string; customerId?: string;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, customerId } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.InvoiceWhereInput = {
      ...(status && { status: status as InvoiceStatus }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { customer: { contactName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, contactName: true, companyName: true, customerNumber: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { select: { id: true, status: true, billingInterval: true } },
        lines: { include: { tax: true }, orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /**
   * Create an invoice with server-calculated totals.
   * Never trust client-provided totals.
   */
  async createInvoice(input: {
    customerId: string;
    subscriptionId?: string;
    billingRunId?: string;
    periodStart?: Date;
    periodEnd?: Date;
    dueDate: Date;
    lines: CreateInvoiceLineInput[];
    notes?: string;
  }, actorId?: string) {
    const invoiceNumber = await this.sequence.getNext('INV');

    // Server-side calculation
    let subtotalPaise = 0;
    let taxPaise = 0;

    const calculatedLines = input.lines.map((line, idx) => {
      const lineSubtotal = line.unitPricePaise * line.quantity;
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
        taxId: line.taxId,
        taxRate: line.taxRate,
        taxPaise: lineTax,
        subtotalPaise: lineSubtotal,
        totalPaise: lineTotal,
        sortOrder: idx,
      };
    });

    const totalPaise = subtotalPaise + taxPaise;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: input.customerId,
        subscriptionId: input.subscriptionId,
        billingRunId: input.billingRunId,
        status: InvoiceStatus.ISSUED,
        subtotalPaise,
        taxPaise,
        discountPaise: 0,
        totalPaise,
        amountPaidPaise: 0,
        amountDuePaise: totalPaise,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        dueDate: input.dueDate,
        notes: input.notes,
        lines: { create: calculatedLines },
      },
      include: { lines: true, customer: true },
    });

    if (actorId) {
      await this.audit.log({ actorId, action: 'CREATE', entity: 'Invoice', entityId: invoice.id, metadata: { invoiceNumber } });
    }

    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus, actorId: string) {
    const invoice = await this.findOne(id);
    if (!isValidInvoiceTransition(invoice.status as any, status as any)) {
      throw new BadRequestException(`Invalid transition from ${invoice.status} to ${status}`);
    }

    const updateData: Prisma.InvoiceUpdateInput = { status };
    if (status === InvoiceStatus.VOID) updateData.voidedAt = new Date();
    if (status === InvoiceStatus.PAID) updateData.paidAt = new Date();

    const updated = await this.prisma.invoice.update({ where: { id }, data: updateData });
    await this.audit.log({ actorId, action: 'STATUS_CHANGE', entity: 'Invoice', entityId: id, metadata: { from: invoice.status, to: status } });
    return updated;
  }
}
