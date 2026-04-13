import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'CUST-001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ 
    example: 'individual', 
    enum: ['individual', 'business'] 
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['individual', 'business'])
  type: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+254712345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'A1234567', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  idNumber?: string;

  @ApiProperty({ example: 'P051234567X', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxPin?: string;

  @ApiProperty({ example: '123 Main Street, Nairobi', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Nairobi', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Kenya', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditDays?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  loyaltyPoints?: number;
}
