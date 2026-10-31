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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductsService = class ProductsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
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
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where, skip, take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { variants: true, _count: { select: { plans: true } } },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
        };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { variants: true, plans: { where: { deletedAt: null } } },
        });
        if (!product || product.deletedAt)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async create(dto, actorId) {
        const product = await this.prisma.product.create({
            data: {
                name: dto.name,
                sku: dto.sku,
                description: dto.description,
                variants: dto.variants ? {
                    create: dto.variants.map((v) => ({
                        name: v.name,
                        sku: v.sku,
                        pricePaise: v.pricePaise,
                        currency: v.currency || 'INR',
                        billingInterval: v.billingInterval || 'MONTHLY',
                    })),
                } : undefined,
            },
            include: { variants: true },
        });
        await this.audit.log({ actorId, action: 'CREATE', entity: 'Product', entityId: product.id });
        return product;
    }
    async update(id, dto, actorId) {
        await this.findOne(id);
        const product = await this.prisma.product.update({
            where: { id },
            data: { name: dto.name, description: dto.description, isActive: dto.isActive },
            include: { variants: true },
        });
        await this.audit.log({ actorId, action: 'UPDATE', entity: 'Product', entityId: id, metadata: { changes: dto } });
        return product;
    }
    async softDelete(id, actorId) {
        await this.findOne(id);
        await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
        await this.audit.log({ actorId, action: 'DELETE', entity: 'Product', entityId: id });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ProductsService);
//# sourceMappingURL=products.service.js.map