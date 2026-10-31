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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const sequence_service_1 = require("../common/services/sequence.service");
const audit_service_1 = require("../common/services/audit.service");
let PaymentsService = class PaymentsService {
    prisma;
    sequence;
    audit;
    constructor(prisma, sequence, audit) {
        this.prisma = prisma;
        this.sequence = sequence;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', customerId, invoiceId } = params;
        const skip = (page - 1) * pageSize;
        const where = {
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
    async findOne(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: { invoice: { include: { customer: true } }, customer: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    /**
     * Record a payment. Updates invoice state transactionally.
     * Rejects overpayments.
     */
    async createPayment(dto, actorId) {
        return this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
            if (!invoice)
                throw new common_1.NotFoundException('Invoice not found');
            if (invoice.status === client_1.InvoiceStatus.VOID) {
                throw new common_1.BadRequestException('Cannot pay a voided invoice');
            }
            if (invoice.status === client_1.InvoiceStatus.PAID) {
                throw new common_1.BadRequestException('Invoice is already fully paid');
            }
            // Reject overpayment
            if (dto.amountPaise > invoice.amountDuePaise) {
                throw new common_1.BadRequestException(`Payment amount (${dto.amountPaise}) exceeds amount due (${invoice.amountDuePaise})`);
            }
            const paymentNumber = await this.sequence.getNext('PAY');
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    invoiceId: dto.invoiceId,
                    customerId: invoice.customerId,
                    amountPaise: dto.amountPaise,
                    method: dto.method || 'BANK_TRANSFER',
                    status: client_1.PaymentStatus.COMPLETED,
                    reference: dto.reference,
                    notes: dto.notes,
                    paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
                },
            });
            // Update invoice amounts
            const newAmountPaid = invoice.amountPaidPaise + dto.amountPaise;
            const newAmountDue = invoice.totalPaise - newAmountPaid;
            const newStatus = newAmountDue <= 0 ? client_1.InvoiceStatus.PAID : client_1.InvoiceStatus.PARTIALLY_PAID;
            await tx.invoice.update({
                where: { id: dto.invoiceId },
                data: {
                    amountPaidPaise: newAmountPaid,
                    amountDuePaise: newAmountDue,
                    status: newStatus,
                    paidAt: newStatus === client_1.InvoiceStatus.PAID ? new Date() : undefined,
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sequence_service_1.SequenceService,
        audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map