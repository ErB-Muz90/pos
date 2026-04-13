import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'ELEC', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ example: 'Electronic devices and accessories', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 16.0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultTaxRate?: number;

  @ApiProperty({ example: 'VAT', enum: ['VAT', 'EXEMPT', 'ZERO_RATED'], required: false })
  @IsString()
  @IsOptional()
  taxType?: string;

  @ApiProperty({ example: 'parent-category-uuid', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
