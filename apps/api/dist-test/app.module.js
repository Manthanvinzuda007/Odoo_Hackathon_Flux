"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const prisma_module_1 = require("./prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const health_module_1 = require("./health/health.module");
const auth_module_1 = require("./auth/auth.module");
const email_module_1 = require("./email/email.module");
const customers_module_1 = require("./customers/customers.module");
const products_module_1 = require("./products/products.module");
const plans_module_1 = require("./plans/plans.module");
const taxes_module_1 = require("./taxes/taxes.module");
const discounts_module_1 = require("./discounts/discounts.module");
const quotations_module_1 = require("./quotations/quotations.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const invoices_module_1 = require("./invoices/invoices.module");
const payments_module_1 = require("./payments/payments.module");
const billing_module_1 = require("./billing/billing.module");
const reports_module_1 = require("./reports/reports.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true } }
                        : undefined,
                    redact: ['req.headers.authorization', 'req.headers.cookie'],
                },
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            email_module_1.EmailModule,
            customers_module_1.CustomersModule,
            products_module_1.ProductsModule,
            plans_module_1.PlansModule,
            taxes_module_1.TaxesModule,
            discounts_module_1.DiscountsModule,
            quotations_module_1.QuotationsModule,
            subscriptions_module_1.SubscriptionsModule,
            invoices_module_1.InvoicesModule,
            payments_module_1.PaymentsModule,
            billing_module_1.BillingModule,
            reports_module_1.ReportsModule,
            audit_logs_module_1.AuditLogsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map