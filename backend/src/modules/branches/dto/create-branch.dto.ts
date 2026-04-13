import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'MAIN-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Nairobi', required: false })
  @IsString()
  @IsOptional()
  county?: string;

  @ApiProperty({ example: 'Nairobi CBD', required: false })
  @IsString()
  @IsOptional()
  town?: string;

  @ApiProperty({ example: '123 Kenyatta Avenue, Nairobi', required: false })
  @IsString()
  @IsOptional()
  physicalAddress?: string;

  @ApiProperty({ example: '-1.2921,36.8219', required: false })
  @IsString()
  @IsOptional()
  gpsCoordinates?: string;

  @ApiProperty({ example: '00', required: false })
  @IsString()
  @IsOptional()
  etimsBhfId?: string;

  @ApiProperty({ example: 'DEV001', required: false })
  @IsString()
  @IsOptional()
  etimsDeviceSerial?: string;

  @ApiProperty({ example: 'Africa/Nairobi', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'KES', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
