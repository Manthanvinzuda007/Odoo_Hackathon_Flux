import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List subscriptions' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.service.findAll({ page, pageSize, search, sortBy, sortOrder, status, customerId });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get subscription' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Create subscription' })
  create(@Body() dto: CreateSubscriptionDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id/status') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Update subscription status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto, @CurrentUser('id') userId: string) {
    return this.service.updateStatus(id, dto, userId);
  }
}
