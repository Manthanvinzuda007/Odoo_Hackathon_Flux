import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Dashboard statistics' })
  getDashboard() { return this.service.getDashboardStats(); }

  @Get('revenue') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Monthly revenue' })
  getRevenue(@Query('months') months?: number) { return this.service.getRevenueByMonth(months); }

  @Get('subscriptions-by-status') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Subscription distribution' })
  getSubsByStatus() { return this.service.getSubscriptionsByStatus(); }

  @Get('invoices-by-status') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Invoice distribution' })
  getInvoicesByStatus() { return this.service.getInvoicesByStatus(); }

  @Get('plan-distribution') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Plan distribution' })
  getPlanDistribution() { return this.service.getPlanDistribution(); }
}
