import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ShiftsService } from './shifts.service';
import { ReceiptService } from './receipt.service';
import { SalesController } from './sales.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [SalesController],
  providers: [SalesService, ShiftsService, ReceiptService],
  exports: [SalesService, ShiftsService, ReceiptService],
})
export class SalesModule {}
