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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PlansService = class PlansService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 20, search, sortBy = 'sortOrder', sortOrder = 'asc', isActive, productId } = params;
        const skip = (page - 1) * pageSize;
        const where = {
            deletedAt: null,
            ...(isActive !== undefined && { isActive }),
            ...(productId && { productId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.plan.findMany({
                where, skip, take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { product: { select: { id: true, name: true, sku: true } } },
            }),
            this.prisma.plan.count({ where }),
        ]);
        return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
    }
    async findOne(id) {
        const plan = await this.prisma.plan.findUnique({
            where: { id },
            include: { product: true },
        });
        if (!plan || plan.deletedAt)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async create(dto, actorId) {
        const plan = await this.prisma.plan.create({
            data: {
                name: dto.name,
                description: dto.description,
                productId: dto.productId,
                pricePaise: dto.pricePaise,
                currency: dto.currency || 'INR',
                billingInterval: dto.billingInterval || 'MONTHLY',
                trialDays: dto.trialDays || 0,
                features: dto.features || [],
                isPublic: dto.isPublic ?? true,
                sortOrder: dto.sortOrder || 0,
            },
            include: { product: true },
        });
        await this.audit.log({ actorId, action: 'CREATE', entity: 'Plan', entityId: plan.id });
        return plan;
    }
    async update(id, dto, actorId) {
        await this.findOne(id);
        const plan = await this.prisma.plan.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                pricePaise: dto.pricePaise,
                billingInterval: dto.billingInterval,
                trialDays: dto.trialDays,
                features: dto.features,
                isActive: dto.isActive,
                isPublic: dto.isPublic,
                sortOrder: dto.sortOrder,
            },
            include: { product: true },
        });
        await this.audit.log({ actorId, action: 'UPDATE', entity: 'Plan', entityId: id, metadata: { changes: dto } });
        return plan;
    }
    async softDelete(id, actorId) {
        await this.findOne(id);
        await this.prisma.plan.update({ where: { id }, data: { deletedAt: new Date() } });
        await this.audit.log({ actorId, action: 'DELETE', entity: 'Plan', entityId: id });
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PlansService);
//# sourceMappingURL=plans.service.js.map