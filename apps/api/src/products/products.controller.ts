import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'List products' })
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('isActive') isActive?: boolean) {
    return this.service.findAll({ page, pageSize, search, sortBy, sortOrder, isActive });
  }

  @Get(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Create product' })
  create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id') @Roles('ADMIN', 'STAFF') @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser('id') userId: string) { return this.service.update(id, dto, userId); }

  @Delete(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.softDelete(id, userId); }
}
