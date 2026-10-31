import { IsString, IsOptional, IsEmail, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty() @IsString() contactName!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pan?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() billingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() shippingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pan?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() billingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() shippingAddress?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
