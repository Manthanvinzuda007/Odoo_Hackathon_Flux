import { IsString, IsOptional, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ description: 'Rate in basis points (1800 = 18%)' }) @IsInt() rate!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}

export class UpdateTaxDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
