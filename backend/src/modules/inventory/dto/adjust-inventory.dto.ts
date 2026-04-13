import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ 
    example: 'adjustment', 
    enum: ['adjustment', 'damage', 'theft', 'recount', 'return'] 
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['adjustment', 'damage', 'theft', 'recount', 'return'])
  type: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 'Stock count correction', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 'REF-001', required: false })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

export class TransferInventoryDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'from-branch-uuid' })
  @IsString()
  @IsNotEmpty()
  fromBranchId: string;

  @ApiProperty({ example: 'to-branch-uuid' })
  @IsString()
  @IsNotEmpty()
  toBranchId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Restocking branch', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiveStockDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 35000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiProperty({ example: 'PO-2024-001', required: false })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiProperty({ example: 'SUP-001', required: false })
  @IsString()
  @IsOptional()
  supplierReference?: string;
}
