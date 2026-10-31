import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List invoices' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.service.findAll({ page, pageSize, search, sortBy, sortOrder, status, customerId });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get invoice' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id/void') @Roles('ADMIN') @ApiOperation({ summary: 'Void invoice' })
  voidInvoice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.updateStatus(id, InvoiceStatus.VOID, userId);
  }
}
