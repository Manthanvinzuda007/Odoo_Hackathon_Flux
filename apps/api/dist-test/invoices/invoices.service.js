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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const sequence_service_1 = require("../common/services/sequence.service");
const audit_service_1 = require("../common/services/audit.service");
const shared_1 = require("@brightloop/shared");
let InvoicesService = class InvoicesService {
    prisma;
    sequence;
    audit;
    constructor(prisma, sequence, audit) {
        this.prisma = prisma;
        this.sequence = sequence;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, customerId } = params;
        const skip = (page - 1) * pageSize;
        const where = {
            ...(status && { status: status }),
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
    async findOne(id) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                subscription: { select: { id: true, status: true, billingInterval: true } },
                lines: { include: { tax: true }, orderBy: { sortOrder: 'asc' } },
                payments: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return invoice;
    }
    /**
     * Create an invoice with server-calculated totals.
     * Never trust client-provided totals.
     */
    async createInvoice(input, actorId) {
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
                status: client_1.InvoiceStatus.ISSUED,
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
    async updateStatus(id, status, actorId) {
        const invoice = await this.findOne(id);
        if (!(0, shared_1.isValidInvoiceTransition)(invoice.status, status)) {
            throw new common_1.BadRequestException(`Invalid transition from ${invoice.status} to ${status}`);
        }
        const updateData = { status };
        if (status === client_1.InvoiceStatus.VOID)
            updateData.voidedAt = new Date();
        if (status === client_1.InvoiceStatus.PAID)
            updateData.paidAt = new Date();
        const updated = await this.prisma.invoice.update({ where: { id }, data: updateData });
        await this.audit.log({ actorId, action: 'STATUS_CHANGE', entity: 'Invoice', entityId: id, metadata: { from: invoice.status, to: status } });
        return updated;
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sequence_service_1.SequenceService,
        audit_service_1.AuditService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map