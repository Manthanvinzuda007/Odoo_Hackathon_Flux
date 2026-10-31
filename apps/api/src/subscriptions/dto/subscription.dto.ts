import { IsString, IsOptional, IsInt, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSubscriptionLineDto {
  @ApiProperty() @IsString() planId!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() quantity?: number;
  @ApiProperty() @IsInt() unitPricePaise!: number;
}

export class CreateSubscriptionDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() quotationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billingInterval?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateSubscriptionLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateSubscriptionLineDto)
  lines!: CreateSubscriptionLineDto[];
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty() @IsString() status!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
}
