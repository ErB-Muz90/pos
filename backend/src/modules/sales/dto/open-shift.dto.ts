import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({
    description: 'Branch ID where shift is being opened',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    description: 'Opening cash amount in register',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  openingCash: number;
}
