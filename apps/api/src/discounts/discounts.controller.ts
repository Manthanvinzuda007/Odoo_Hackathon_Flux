import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List discounts' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('isActive') isActive?: boolean) {
    return this.service.findAll({ page, pageSize, search, isActive });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get discount' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN') @ApiOperation({ summary: 'Create discount' })
  create(@Body() dto: CreateDiscountDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Update discount' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto, @CurrentUser('id') userId: string) { return this.service.update(id, dto, userId); }
}
