import { Module } from '@nestjs/common';
import {
  AuditLogsCompatController,
  HeldReceiptsCompatController,
  LayawaysCompatController,
  PayoutsCompatController,
  PurchaseOrdersCompatController,
  QuotationsCompatController,
  SalesOrdersCompatController,
  SettingsCompatController,
  ShiftsCompatController,
  SupplierInvoicesCompatController,
  TimeClockEventsCompatController,
  WorkOrdersCompatController,
} from './contracts.controller';

@Module({
  controllers: [
    PurchaseOrdersCompatController,
    SupplierInvoicesCompatController,
    QuotationsCompatController,
    SettingsCompatController,
    AuditLogsCompatController,
    ShiftsCompatController,
    TimeClockEventsCompatController,
    PayoutsCompatController,
    LayawaysCompatController,
    WorkOrdersCompatController,
    SalesOrdersCompatController,
    HeldReceiptsCompatController,
  ],
})
export class ContractsModule {}
