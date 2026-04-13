import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 42000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiProperty({ example: 16.0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'customer-uuid', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'shift-uuid', required: false })
  @IsString()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({ 
    type: [SaleItemDto],
    example: [
      { productId: 'prod-1', quantity: 2, unitPrice: 42000, discount: 0, taxRate: 16 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiProperty({ 
    example: 'cash', 
    enum: ['cash', 'mpesa', 'card', 'bank_transfer', 'credit'],
    required: false 
  })
  @IsString()
  @IsOptional()
  @IsEnum(['cash', 'mpesa', 'card', 'bank_transfer', 'credit'])
  paymentMethod?: string;

  @ApiProperty({ example: 'Sale notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class VoidSaleDto {
  @ApiProperty({ example: 'Incorrect items' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
