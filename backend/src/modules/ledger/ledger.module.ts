import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
