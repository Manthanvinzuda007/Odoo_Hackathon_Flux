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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quotations_service_1 = require("./quotations.service");
const quotation_dto_1 = require("./dto/quotation.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let QuotationsController = class QuotationsController {
    quotationsService;
    constructor(quotationsService) {
        this.quotationsService = quotationsService;
    }
    async findAll(page, pageSize, search, sortBy, sortOrder, status, customerId) {
        return this.quotationsService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
            search,
            sortBy,
            sortOrder,
            status,
            customerId,
        });
    }
    async findOne(id, user) {
        const quotation = await this.quotationsService.findOne(id);
        if (user.role === client_1.UserRole.CUSTOMER && user.customerProfileId) {
            if (quotation.customerId !== user.customerProfileId) {
                throw new common_1.ForbiddenException('Access denied to this quotation');
            }
        }
        return quotation;
    }
    async create(dto, userId) {
        return this.quotationsService.create(dto, userId);
    }
    async updateStatus(id, dto, userId) {
        return this.quotationsService.updateStatus(id, dto.status, userId);
    }
    async accept(id, user) {
        const quotation = await this.quotationsService.findOne(id);
        const customerId = user.customerProfileId || quotation.customerId;
        return this.quotationsService.acceptByCustomer(id, customerId, user.id);
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'List quotations with pagination and search' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF, client_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get quotation by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new quotation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quotation_dto_1.CreateQuotationDto, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update quotation status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quotation_dto_1.UpdateQuotationStatusDto, String]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CUSTOMER, client_1.UserRole.ADMIN, client_1.UserRole.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a quotation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QuotationsController.prototype, "accept", null);
exports.QuotationsController = QuotationsController = __decorate([
    (0, swagger_1.ApiTags)('quotations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('quotations'),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService])
], QuotationsController);
//# sourceMappingURL=quotations.controller.js.map