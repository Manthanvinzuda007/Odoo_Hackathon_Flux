import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty() @IsInt() pricePaise!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billingInterval?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() sku!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
