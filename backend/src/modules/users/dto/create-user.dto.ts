import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+254722123456', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 6, required: false })
  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(6)
  pin?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ 
    example: 'cashier', 
    enum: ['admin', 'manager', 'cashier', 'accountant'] 
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['admin', 'manager', 'cashier', 'accountant'])
  role: string;

  @ApiProperty({ example: 'EMP-001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  employeeCode?: string;

  @ApiProperty({ example: 'branch-uuid', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    example: {
      sales: { create: true, read: true },
      products: { read: true },
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
