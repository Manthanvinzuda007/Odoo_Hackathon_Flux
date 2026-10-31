import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';

export class QuotationLineDto {
  @ApiProperty({ description: 'Line item description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Quantity', default: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Unit price in paise' })
  @IsInt()
  @Min(0)
  unitPricePaise!: number;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Tax rate in basis points (e.g., 1800 for 18%)' })
  @IsOptional()
  @IsInt()
  taxRate?: number;
}

export class CreateQuotationDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({ description: 'Template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Notes or terms' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Quotation expiry date (ISO 8601)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Discount in paise' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountPaise?: number;

  @ApiProperty({ description: 'Quotation lines', type: [QuotationLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineDto)
  lines!: QuotationLineDto[];
}

export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: QuotationStatus, description: 'New quotation status' })
  @IsEnum(QuotationStatus)
  status!: QuotationStatus;
}
