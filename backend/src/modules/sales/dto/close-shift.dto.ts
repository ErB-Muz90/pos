import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseShiftDto {
  @ApiProperty({
    description: 'Actual cash count at shift close',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  closingCash: number;

  @ApiProperty({
    description: 'Notes about the shift',
    example: 'Everything balanced correctly',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
