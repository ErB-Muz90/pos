import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Demo Store Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'retail', enum: ['retail', 'wholesale', 'restaurant', 'service'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['retail', 'wholesale', 'restaurant', 'service'])
  businessType: string;

  @ApiProperty({ example: 'P051234567X' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  taxPin: string;

  @ApiProperty({ example: '123 Kenyatta Avenue, Nairobi', required: false })
  @IsString()
  @IsOptional()
  physicalAddress?: string;

  @ApiProperty({ example: '+254712345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'info@demostore.co.ke', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'production', enum: ['sandbox', 'production'], required: false })
  @IsString()
  @IsOptional()
  @IsEnum(['sandbox', 'production'])
  etimsEnvironment?: string;

  @ApiProperty({ example: '00', required: false })
  @IsString()
  @IsOptional()
  etimsBhfId?: string;

  @ApiProperty({ example: 'DEV001', required: false })
  @IsString()
  @IsOptional()
  etimsDeviceSerial?: string;

  @ApiProperty({ example: 'P051234567X', required: false })
  @IsString()
  @IsOptional()
  etimsTin?: string;

  @ApiProperty({ example: 'professional', enum: ['starter', 'professional', 'enterprise'], required: false })
  @IsString()
  @IsOptional()
  @IsEnum(['starter', 'professional', 'enterprise'])
  subscriptionTier?: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxBranches?: number;

  @ApiProperty({ example: 20, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxUsers?: number;

  @ApiProperty({ example: 'Main Branch', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  branchName?: string;

  @ApiProperty({ example: 'MAIN', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  branchCode?: string;

  @ApiProperty({ example: 'admin@demostore.co.ke', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  adminUsername?: string;

  @ApiProperty({ example: 'admin@demostore.co.ke', required: false })
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @ApiProperty({ example: 'Store Administrator', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  adminFullName?: string;

  @ApiProperty({ example: 'Password123!', required: false, minLength: 8 })
  @IsString()
  @IsOptional()
  @MinLength(8)
  adminPassword?: string;

  @ApiProperty({ example: 'active', required: false, enum: ['active', 'trial', 'expired', 'suspended'] })
  @IsString()
  @IsOptional()
  @IsEnum(['active', 'trial', 'expired', 'suspended'])
  subscriptionStatus?: string;

  @ApiProperty({ example: 'active', required: false, enum: ['active', 'suspended'] })
  @IsString()
  @IsOptional()
  @IsEnum(['active', 'suspended'])
  status?: string;
}
