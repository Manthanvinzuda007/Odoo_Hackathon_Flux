"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sequence_service_1 = require("../common/services/sequence.service");
const audit_service_1 = require("../common/services/audit.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const shared_1 = require("@brightloop/shared");
let BillingService = BillingService_1 = class BillingService {
    prisma;
    sequence;
    audit;
    emailService;
    logger = new common_1.Logger(BillingService_1.name);
    constructor(prisma, sequence, audit, emailService) {
        this.prisma = prisma;
        this.sequence = sequence;
        this.audit = audit;
        this.emailService = emailService;
    }
    calculateNextPeriod(interval, fromDate) {
        switch (interval) {
            case client_1.BillingInterval.MONTHLY:
                return (0, date_fns_1.addMonths)(fromDate, 1);
            case client_1.BillingInterval.QUARTERLY:
                return (0, date_fns_1.addMonths)(fromDate, 3);
            case client_1.BillingInterval.HALF_YEARLY:
                return (0, date_fns_1.addMonths)(fromDate, 6);
            case client_1.BillingInterval.YEARLY:
                return (0, date_fns_1.addYears)(fromDate, 1);
            default:
                return (0, date_fns_1.addMonths)(fromDate, 1);
        }
    }
    async runBillingCycle(actorId) {
        const now = new Date();
        this.logger.log(`Starting billing cycle at ${now.toISOString()}`);
        const billingRun = await this.prisma.billingRun.create({
            data: {
                status: client_1.BillingRunStatus.RUNNING,
                startedAt: now,
            },
        });
        // Find all active subscriptions due for billing
        const dueSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
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
        const errors = [];
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
                            status: client_1.InvoiceStatus.ISSUED,
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
                        this.emailService.sendInvoiceCreated(sub.customer.email, sub.customer.contactName, invoiceNumber, (0, shared_1.formatINR)(totalPaise), dueDate.toLocaleDateString('en-IN')).catch(() => { });
                    }
                });
                succeeded++;
            }
            catch (err) {
                failed++;
                this.logger.error(`Failed to process subscription ${sub.id}: ${err.message}`);
                errors.push({ subscriptionId: sub.id, error: err.message });
            }
        }
        const finalStatus = failed === 0
            ? client_1.BillingRunStatus.COMPLETED
            : succeeded === 0
                ? client_1.BillingRunStatus.FAILED
                : client_1.BillingRunStatus.PARTIAL;
        const completed = await this.prisma.billingRun.update({
            where: { id: billingRun.id },
            data: {
                status: finalStatus,
                completedAt: new Date(),
                totalProcessed: dueSubscriptions.length,
                totalSucceeded: succeeded,
                totalFailed: failed,
                errors: errors.length > 0 ? errors : undefined,
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
    async getRuns(params) {
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
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sequence_service_1.SequenceService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], BillingService);
//# sourceMappingURL=billing.service.js.map