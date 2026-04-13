import { IsNumber, IsString, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ManagerOverrideDto {
  @IsString() managerId: string;
  @IsString() reason: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 25000, minimum: 0 })
  @IsNumber()
  @Min(0)
  closingCash: number;

  @IsString()
  @IsOptional()
  notes?: string;

  /** Required when variance > KES 5 */
  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerOverrideDto)
  managerOverride?: ManagerOverrideDto;
}
