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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ReportsController = class ReportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getDashboard() { return this.service.getDashboardStats(); }
    getRevenue(months) { return this.service.getRevenueByMonth(months); }
    getSubsByStatus() { return this.service.getSubscriptionsByStatus(); }
    getInvoicesByStatus() { return this.service.getInvoicesByStatus(); }
    getPlanDistribution() { return this.service.getPlanDistribution(); }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Monthly revenue' }),
    __param(0, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('subscriptions-by-status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Subscription distribution' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getSubsByStatus", null);
__decorate([
    (0, common_1.Get)('invoices-by-status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Invoice distribution' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getInvoicesByStatus", null);
__decorate([
    (0, common_1.Get)('plan-distribution'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: 'Plan distribution' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPlanDistribution", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map