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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const shared_1 = require("@brightloop/shared");
const date_fns_1 = require("date-fns");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
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
                    { customer: { contactName: { contains: search, mode: 'insensitive' } } },
                    { customer: { companyName: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where, skip, take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    customer: { select: { id: true, contactName: true, companyName: true, customerNumber: true } },
                    lines: { include: { plan: { select: { id: true, name: true } } } },
                },
            }),
            this.prisma.subscription.count({ where }),
        ]);
        return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 } };
    }
    async findOne(id) {
        const sub = await this.prisma.subscription.findUnique({
            where: { id },
            include: {
                customer: true,
                lines: { include: { plan: true } },
                invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
                quotation: true,
            },
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        return sub;
    }
    async create(dto, actorId) {
        // Calculate MRR from lines
        let totalMonthlyPaise = 0;
        for (const line of dto.lines) {
            totalMonthlyPaise += line.unitPricePaise * (line.quantity || 1);
        }
        const billingInterval = dto.billingInterval || 'MONTHLY';
        // Normalize to monthly for MRR
        const intervalMultiplier = {
            MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12,
        };
        const months = intervalMultiplier[billingInterval] || 1;
        const mrrPaise = Math.round(totalMonthlyPaise / months);
        const sub = await this.prisma.subscription.create({
            data: {
                customerId: dto.customerId,
                quotationId: dto.quotationId,
                billingInterval,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                notes: dto.notes,
                mrrPaise,
                status: client_1.SubscriptionStatus.DRAFT,
                lines: {
                    create: dto.lines.map((l) => ({
                        planId: l.planId,
                        description: l.description,
                        quantity: l.quantity || 1,
                        unitPricePaise: l.unitPricePaise,
                    })),
                },
            },
            include: { lines: { include: { plan: true } }, customer: true },
        });
        await this.audit.log({ actorId, action: 'CREATE', entity: 'Subscription', entityId: sub.id });
        return sub;
    }
    async updateStatus(id, dto, actorId) {
        const sub = await this.findOne(id);
        const newStatus = dto.status;
        if (!(0, shared_1.isValidSubscriptionTransition)(sub.status, newStatus)) {
            throw new common_1.BadRequestException(`Invalid transition from ${sub.status} to ${newStatus}`);
        }
        const updateData = { status: newStatus };
        const now = new Date();
        switch (newStatus) {
            case client_1.SubscriptionStatus.ACTIVE:
                updateData.startDate = sub.startDate || now;
                updateData.currentPeriodStart = now;
                updateData.currentPeriodEnd = this.getNextPeriodEnd(now, sub.billingInterval);
                updateData.nextBillingDate = this.getNextPeriodEnd(now, sub.billingInterval);
                updateData.pausedAt = null;
                break;
            case client_1.SubscriptionStatus.PAUSED:
                updateData.pausedAt = now;
                break;
            case client_1.SubscriptionStatus.CANCELLED:
                updateData.cancelledAt = now;
                updateData.cancelReason = dto.cancelReason;
                break;
            case client_1.SubscriptionStatus.CLOSED:
                updateData.endDate = now;
                break;
        }
        const updated = await this.prisma.subscription.update({
            where: { id },
            data: updateData,
            include: { lines: { include: { plan: true } }, customer: true },
        });
        await this.audit.log({
            actorId,
            action: 'STATUS_CHANGE',
            entity: 'Subscription',
            entityId: id,
            metadata: { from: sub.status, to: newStatus, cancelReason: dto.cancelReason },
        });
        return updated;
    }
    getNextPeriodEnd(from, interval) {
        switch (interval) {
            case 'MONTHLY': return (0, date_fns_1.addMonths)(from, 1);
            case 'QUARTERLY': return (0, date_fns_1.addMonths)(from, 3);
            case 'HALF_YEARLY': return (0, date_fns_1.addMonths)(from, 6);
            case 'YEARLY': return (0, date_fns_1.addMonths)(from, 12);
            default: return (0, date_fns_1.addMonths)(from, 1);
        }
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map