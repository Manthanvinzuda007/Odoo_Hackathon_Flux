import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { TaxesModule } from './taxes/taxes.module';
import { DiscountsModule } from './discounts/discounts.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { BillingModule } from './billing/billing.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    EmailModule,
    CustomersModule,
    ProductsModule,
    PlansModule,
    TaxesModule,
    DiscountsModule,
    QuotationsModule,
    SubscriptionsModule,
    InvoicesModule,
    PaymentsModule,
    BillingModule,
    ReportsModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
