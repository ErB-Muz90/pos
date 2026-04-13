import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TimescaleDBService } from './timescaledb.service';

@Global()
@Module({
  providers: [PrismaService, TimescaleDBService],
  exports: [PrismaService, TimescaleDBService],
})
export class DatabaseModule {}
