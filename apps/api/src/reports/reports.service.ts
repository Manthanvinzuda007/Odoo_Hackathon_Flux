import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      activeSubscriptions,
      totalCustomers,
      mrrResult,
      revenueResult,
      outstandingResult,
      overdueResult,
      newSubsThisMonth,
      paidInvoicesCount,
      overdueInvoicesCount,
      recentPayments,
      recentSubscriptions,
    ] = await Promise.all([
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.customer.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.subscription.aggregate({
        where: { status: SubscriptionStatus.ACTIVE },
        _sum: { mrrPaise: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountPaise: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] } },
        _sum: { amountDuePaise: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.OVERDUE },
        _sum: { amountDuePaise: true },
      }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          startDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
      this.prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { contactName: true } }, invoice: { select: { invoiceNumber: true } } },
      }),
      this.prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { contactName: true, companyName: true } } },
      }),
    ]);

    const mrrPaise = mrrResult._sum.mrrPaise || 0;

    return {
      kpis: {
        mrr: mrrPaise,
        arr: mrrPaise * 12,
        activeSubscriptions,
        totalCustomers,
        totalRevenue: revenueResult._sum.amountPaise || 0,
        outstanding: outstandingResult._sum.amountDuePaise || 0,
        overdue: overdueResult._sum.amountDuePaise || 0,
        newSubscriptionsThisMonth: newSubsThisMonth,
        paidInvoices: paidInvoicesCount,
        overdueInvoices: overdueInvoicesCount,
      },
      recentActivity: {
        payments: recentPayments,
        subscriptions: recentSubscriptions,
      },
    };
  }

  async getRevenueByMonth(months: number = 12) {
    const result = await this.prisma.$queryRaw<Array<{ month: string; revenue: bigint }>>`
      SELECT
        TO_CHAR(paid_at, 'YYYY-MM') as month,
        COALESCE(SUM(amount_paise), 0) as revenue
      FROM payments
      WHERE status = 'COMPLETED'
        AND paid_at >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    return result.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
  }

  async getSubscriptionsByStatus() {
    const result = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
    });
    return result.map((r) => ({ status: r.status, count: r._count }));
  }

  async getInvoicesByStatus() {
    const result = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
    });
    return result.map((r) => ({ status: r.status, count: r._count }));
  }

  async getPlanDistribution() {
    const result = await this.prisma.subscriptionLine.groupBy({
      by: ['planId'],
      _count: true,
      where: { subscription: { status: SubscriptionStatus.ACTIVE } },
    });

    const planIds = result.map((r) => r.planId);
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p.name]));
    return result.map((r) => ({
      planId: r.planId,
      planName: planMap.get(r.planId) || 'Unknown',
      count: r._count,
    }));
  }
}
