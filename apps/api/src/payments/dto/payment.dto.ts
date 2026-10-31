import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty() @IsString() invoiceId!: string;
  @ApiProperty() @IsInt() amountPaise!: number;
  @ApiPropertyOptional({ enum: ['BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'CHEQUE', 'GATEWAY', 'OTHER'] })
  @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidAt?: string;
}
