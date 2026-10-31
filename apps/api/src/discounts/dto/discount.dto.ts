import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscountDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED'] }) @IsString() type!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() valuePaise?: number;
  @ApiPropertyOptional({ description: 'In basis points (1000 = 10%)' }) @IsOptional() @IsInt() percentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() minPurchasePaise?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxUsage?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxPerCustomer?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
}

export class UpdateDiscountDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() valuePaise?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() percentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() minPurchasePaise?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxUsage?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() maxPerCustomer?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
