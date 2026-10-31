import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List plans' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('isActive') isActive?: boolean, @Query('productId') productId?: string) {
    return this.service.findAll({ page, pageSize, search, sortBy, sortOrder, isActive, productId });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get plan' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Create plan' })
  create(@Body() dto: CreatePlanDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Update plan' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto, @CurrentUser('id') userId: string) { return this.service.update(id, dto, userId); }

  @Delete(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Delete plan' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.softDelete(id, userId); }
}
