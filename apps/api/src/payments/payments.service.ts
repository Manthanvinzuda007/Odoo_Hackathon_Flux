import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, InvoiceStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/services/sequence.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: {
    page?: number; pageSize?: number; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
    customerId?: string; invoiceId?: string;
  }) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', customerId, invoiceId } = params;
    const skip = (page - 1) * pageSize;
    const where: Prisma.PaymentWhereInput = {
      ...(customerId && { customerId }),
      ...(invoiceId && { invoiceId }),
      ...(search && {
        OR: [
          { paymentNumber: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where, skip, take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          invoice: { select: { id: true, invoiceNumber: true, totalPaise: true } },
          customer: { select: { id: true, contactName: true, customerNumber: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { customer: true } }, customer: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Record a payment. Updates invoice state transactionally.
   * Rejects overpayments.
   */
  async createPayment(dto: CreatePaymentDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      if (invoice.status === InvoiceStatus.VOID) {
        throw new BadRequestException('Cannot pay a voided invoice');
      }
      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already fully paid');
      }

      // Reject overpayment
      if (dto.amountPaise > invoice.amountDuePaise) {
        throw new BadRequestException(
          `Payment amount (${dto.amountPaise}) exceeds amount due (${invoice.amountDuePaise})`,
        );
      }

      const paymentNumber = await this.sequence.getNext('PAY');

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: dto.invoiceId,
          customerId: invoice.customerId,
          amountPaise: dto.amountPaise,
          method: (dto.method as any) || 'BANK_TRANSFER',
          status: PaymentStatus.COMPLETED,
          reference: dto.reference,
          notes: dto.notes,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        },
      });

      // Update invoice amounts
      const newAmountPaid = invoice.amountPaidPaise + dto.amountPaise;
      const newAmountDue = invoice.totalPaise - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          amountPaidPaise: newAmountPaid,
          amountDuePaise: newAmountDue,
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
        },
      });

      await this.audit.log({
        actorId,
        action: 'PAYMENT',
        entity: 'Payment',
        entityId: payment.id,
        metadata: { invoiceId: dto.invoiceId, amountPaise: dto.amountPaise, paymentNumber },
      });

      return payment;
    });
  }
}
