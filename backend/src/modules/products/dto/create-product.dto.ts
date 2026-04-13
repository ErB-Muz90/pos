import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy A54' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '5G Smartphone with 128GB storage', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'PHONE-SAM-A54', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ example: '8806094937267', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ example: 'category-uuid', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  costPrice: number;

  @ApiProperty({ example: 42000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 40000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  wholesalePrice?: number;

  @ApiProperty({ example: 38000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumPrice?: number;

  @ApiProperty({ example: 16.0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  taxInclusive?: boolean;

  @ApiProperty({ example: 'VAT', required: false })
  @IsString()
  @IsOptional()
  taxType?: string;

  @ApiProperty({ example: '4622', required: false })
  @IsString()
  @IsOptional()
  etimsItemClsCd?: string;

  @ApiProperty({ example: '2', required: false })
  @IsString()
  @IsOptional()
  etimsItemTyCd?: string;

  @ApiProperty({ example: 'EA', required: false })
  @IsString()
  @IsOptional()
  etimsPkgUnitCd?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiProperty({ example: 'piece', required: false })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderQuantity?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isService?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isVariant?: boolean;

  @ApiProperty({ example: 'parent-product-uuid', required: false })
  @IsString()
  @IsOptional()
  parentProductId?: string;

  @ApiProperty({ 
    example: { color: 'Blue', size: 'Large' }, 
    required: false 
  })
  @IsObject()
  @IsOptional()
  variantAttributes?: Record<string, any>;

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg'], 
    required: false 
  })
  @IsArray()
  @IsOptional()
  images?: string[];
}
