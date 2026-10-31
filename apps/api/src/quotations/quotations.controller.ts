import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto, UpdateQuotationStatusDto } from './dto/quotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List quotations with pagination and search' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.quotationsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      sortBy,
      sortOrder,
      status,
      customerId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get quotation by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const quotation = await this.quotationsService.findOne(id);
    if (user.role === UserRole.CUSTOMER && user.customerProfileId) {
      if (quotation.customerId !== user.customerProfileId) {
        throw new ForbiddenException('Access denied to this quotation');
      }
    }
    return quotation;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new quotation' })
  async create(@Body() dto: CreateQuotationDto, @CurrentUser('id') userId: string) {
    return this.quotationsService.create(dto, userId);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update quotation status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationsService.updateStatus(id, dto.status, userId);
  }

  @Post(':id/accept')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Accept a quotation' })
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const quotation = await this.quotationsService.findOne(id);
    const customerId = user.customerProfileId || quotation.customerId;
    return this.quotationsService.acceptByCustomer(id, customerId, user.id);
  }
}
