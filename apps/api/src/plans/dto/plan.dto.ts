import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() productId!: string;
  @ApiProperty() @IsInt() pricePaise!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billingInterval?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdatePlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() pricePaise?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() billingInterval?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() trialDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}
