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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const sequence_service_1 = require("../common/services/sequence.service");
const audit_service_1 = require("../common/services/audit.service");
const shared_1 = require("@brightloop/shared");
let QuotationsService = class QuotationsService {
    prisma;
    sequence;
    audit;
    constructor(prisma, sequence, audit) {
        this.prisma = prisma;
        this.sequence = sequence;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, customerId, } = params;
        const skip = (page - 1) * pageSize;
        const where = {
            ...(status && { status: status }),
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Quotation with ID "${id}" not found`);
        }
        return quotation;
    }
    async create(dto, userId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: dto.customerId },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID "${dto.customerId}" not found`);
        }
        if (!dto.lines || dto.lines.length === 0) {
            throw new common_1.BadRequestException('Quotation must have at least one line item');
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
                status: client_1.QuotationStatus.DRAFT,
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
    async updateStatus(id, newStatus, userId) {
        const quotation = await this.findOne(id);
        if (quotation.status === newStatus) {
            return quotation;
        }
        if (!(0, shared_1.isValidQuotationTransition)(quotation.status, newStatus)) {
            throw new common_1.BadRequestException(`Invalid quotation transition from ${quotation.status} to ${newStatus}`);
        }
        const updateData = {
            status: newStatus,
        };
        if (newStatus === client_1.QuotationStatus.SENT && !quotation.sentAt) {
            updateData.sentAt = new Date();
        }
        else if (newStatus === client_1.QuotationStatus.ACCEPTED) {
            updateData.acceptedAt = new Date();
        }
        else if (newStatus === client_1.QuotationStatus.REJECTED) {
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
    async acceptByCustomer(id, customerId, userId) {
        const quotation = await this.findOne(id);
        if (quotation.customerId !== customerId) {
            throw new common_1.ForbiddenException('You cannot accept a quotation that belongs to another customer');
        }
        if (quotation.status !== client_1.QuotationStatus.SENT && quotation.status !== client_1.QuotationStatus.DRAFT) {
            throw new common_1.BadRequestException(`Quotation in status ${quotation.status} cannot be accepted`);
        }
        if (quotation.expiresAt && new Date(quotation.expiresAt) < new Date()) {
            await this.prisma.quotation.update({
                where: { id },
                data: { status: client_1.QuotationStatus.EXPIRED },
            });
            throw new common_1.BadRequestException('This quotation has expired');
        }
        const updated = await this.prisma.quotation.update({
            where: { id },
            data: {
                status: client_1.QuotationStatus.ACCEPTED,
                acceptedAt: new Date(),
            },
            include: { customer: true, lines: true },
        });
        await this.audit.log({
            entity: 'Quotation',
            entityId: id,
            action: 'UPDATE',
            actorId: userId,
            metadata: { status: { from: quotation.status, to: client_1.QuotationStatus.ACCEPTED }, acceptedBy: customerId },
        });
        return updated;
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sequence_service_1.SequenceService,
        audit_service_1.AuditService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map