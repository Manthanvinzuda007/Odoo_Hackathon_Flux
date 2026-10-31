import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TaxesService } from './taxes.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Taxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('taxes')
export class TaxesController {
  constructor(private readonly service: TaxesService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List taxes' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('isActive') isActive?: boolean) {
    return this.service.findAll({ page, pageSize, search, isActive });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get tax' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN') @ApiOperation({ summary: 'Create tax' })
  create(@Body() dto: CreateTaxDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Update tax' })
  update(@Param('id') id: string, @Body() dto: UpdateTaxDto, @CurrentUser('id') userId: string) { return this.service.update(id, dto, userId); }
}
