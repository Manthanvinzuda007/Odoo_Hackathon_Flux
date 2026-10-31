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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sequence_service_1 = require("../common/services/sequence.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomersService = class CustomersService {
    prisma;
    sequence;
    audit;
    constructor(prisma, sequence, audit) {
        this.prisma = prisma;
        this.sequence = sequence;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = params;
        const skip = (page - 1) * pageSize;
        const where = {
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
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
                _count: { select: { subscriptions: true, invoices: true, quotations: true } },
            },
        });
        if (!customer || customer.deletedAt)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async create(dto, actorId) {
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
                billingAddress: dto.billingAddress,
                shippingAddress: dto.shippingAddress,
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
    async update(id, dto, actorId) {
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
                billingAddress: dto.billingAddress,
                shippingAddress: dto.shippingAddress,
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
    async softDelete(id, actorId) {
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
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sequence_service_1.SequenceService,
        audit_service_1.AuditService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map