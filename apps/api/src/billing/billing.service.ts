import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../common/services/sequence.service';
import { AuditService } from '../common/services/audit.service';
import { EmailService } from '../email/email.service';
import {
  BillingRunStatus,
  SubscriptionStatus,
  InvoiceStatus,
  BillingInterval,
} from '@prisma/client';
import { addMonths, addYears } from 'date-fns';
import { formatINR } from '@brightloop/shared';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly audit: AuditService,
    private readonly emailService: EmailService,
  ) {}

  private calculateNextPeriod(interval: BillingInterval, fromDate: Date): Date {
    switch (interval) {
      case BillingInterval.MONTHLY:
        return addMonths(fromDate, 1);
      case BillingInterval.QUARTERLY:
        return addMonths(fromDate, 3);
      case BillingInterval.HALF_YEARLY:
        return addMonths(fromDate, 6);
      case BillingInterval.YEARLY:
        return addYears(fromDate, 1);
      default:
        return addMonths(fromDate, 1);
    }
  }

  async runBillingCycle(actorId?: string) {
    const now = new Date();
    this.logger.log(`Starting billing cycle at ${now.toISOString()}`);

    const billingRun = await this.prisma.billingRun.create({
      data: {
        status: BillingRunStatus.RUNNING,
        startedAt: now,
      },
    });

    // Find all active subscriptions due for billing
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: {
          lte: now,
        },
      },
      include: {
        customer: true,
        lines: {
          include: {
            plan: true,
          },
        },
      },
    });

    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ subscriptionId: string; error: string }> = [];

    for (const sub of dueSubscriptions) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const periodStart = sub.nextBillingDate || sub.currentPeriodEnd || now;
          const periodEnd = this.calculateNextPeriod(sub.billingInterval, periodStart);
          const dueDate = new Date(periodStart.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days due

          let subtotalPaise = 0;
          let taxPaise = 0;

          const invoiceLinesData = sub.lines.map((line, idx) => {
            const lineSubtotal = line.quantity * line.unitPricePaise;
            // Standard tax computation (18% default GST if applicable)
            const lineTax = Math.round((lineSubtotal * 1800) / 10000);
            const lineTotal = lineSubtotal + lineTax;

            subtotalPaise += lineSubtotal;
            taxPaise += lineTax;

            return {
              description: `${line.plan.name} (${sub.billingInterval})`,
              quantity: line.quantity,
              unitPricePaise: line.unitPricePaise,
              taxRate: 1800,
              taxPaise: lineTax,
              subtotalPaise: lineSubtotal,
              totalPaise: lineTotal,
              sortOrder: idx,
            };
          });

          const totalPaise = subtotalPaise + taxPaise;
          const invoiceNumber = await this.sequence.getNext('INV');

          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              billingRunId: billingRun.id,
              status: InvoiceStatus.ISSUED,
              periodStart,
              periodEnd,
              dueDate,
              subtotalPaise,
              taxPaise,
              discountPaise: 0,
              totalPaise,
              amountPaidPaise: 0,
              amountDuePaise: totalPaise,
              lines: {
                create: invoiceLinesData,
              },
            },
          });

          // Advance subscription billing periods
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              nextBillingDate: periodEnd,
            },
          });

          // Email notification
          if (sub.customer.email) {
            this.emailService.sendInvoiceCreated(
              sub.customer.email,
              sub.customer.contactName,
              invoiceNumber,
              formatINR(totalPaise),
              dueDate.toLocaleDateString('en-IN'),
            ).catch(() => {});
          }
        });

        succeeded++;
      } catch (err: any) {
        failed++;
        this.logger.error(`Failed to process subscription ${sub.id}: ${err.message}`);
        errors.push({ subscriptionId: sub.id, error: err.message });
      }
    }

    const finalStatus =
      failed === 0
        ? BillingRunStatus.COMPLETED
        : succeeded === 0
        ? BillingRunStatus.FAILED
        : BillingRunStatus.PARTIAL;

    const completed = await this.prisma.billingRun.update({
      where: { id: billingRun.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        totalProcessed: dueSubscriptions.length,
        totalSucceeded: succeeded,
        totalFailed: failed,
        errors: errors.length > 0 ? (errors as any) : undefined,
      },
    });

    await this.audit.log({
      entity: 'BillingRun',
      entityId: billingRun.id,
      action: 'EXECUTE',
      actorId,
      metadata: {
        dueSubscriptions: dueSubscriptions.length,
        succeeded,
        failed,
        status: finalStatus,
      },
    });

    return completed;
  }

  async getRuns(params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.billingRun.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.billingRun.count(),
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
}
