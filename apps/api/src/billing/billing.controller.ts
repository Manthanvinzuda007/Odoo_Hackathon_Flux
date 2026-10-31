import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Execute recurring billing cycle for all due subscriptions' })
  async triggerBillingRun(@CurrentUser('id') userId: string) {
    return this.billingService.runBillingCycle(userId);
  }

  @Get('runs')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List billing runs and execution stats' })
  async getRuns(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.billingService.getRuns({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}
