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
exports.TaxesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let TaxesService = class TaxesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(params) {
        const { page = 1, pageSize = 50, search, isActive } = params;
        const skip = (page - 1) * pageSize;
        const where = {
            ...(isActive !== undefined && { isActive }),
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.tax.findMany({ where, skip, take: pageSize, orderBy: { name: 'asc' } }),
            this.prisma.tax.count({ where }),
        ]);
        return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
    }
    async findOne(id) {
        const tax = await this.prisma.tax.findUnique({ where: { id } });
        if (!tax)
            throw new common_1.NotFoundException('Tax not found');
        return tax;
    }
    async create(dto, actorId) {
        const tax = await this.prisma.tax.create({
            data: { name: dto.name, rate: dto.rate, type: dto.type || 'GST' },
        });
        await this.audit.log({ actorId, action: 'CREATE', entity: 'Tax', entityId: tax.id });
        return tax;
    }
    async update(id, dto, actorId) {
        await this.findOne(id);
        const tax = await this.prisma.tax.update({
            where: { id },
            data: { name: dto.name, rate: dto.rate, type: dto.type, isActive: dto.isActive },
        });
        await this.audit.log({ actorId, action: 'UPDATE', entity: 'Tax', entityId: id, metadata: { changes: dto } });
        return tax;
    }
};
exports.TaxesService = TaxesService;
exports.TaxesService = TaxesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], TaxesService);
//# sourceMappingURL=taxes.service.js.map