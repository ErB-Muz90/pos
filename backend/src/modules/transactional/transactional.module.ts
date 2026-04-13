import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { SupplierInvoicesController } from './supplier-invoices.controller';
import { SupplierInvoicesService } from './supplier-invoices.service';
import { LayawaysController } from './layaways.controller';
import { LayawaysService } from './layaways.service';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { HeldReceiptsController } from './held-receipts.controller';
import { HeldReceiptsService } from './held-receipts.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  controllers: [
    ExpensesController, QuotationsController, PurchaseOrdersController,
    SupplierInvoicesController, LayawaysController, WorkOrdersController,
    SalesOrdersController, HeldReceiptsController, SettingsController, AuditLogsController,
  ],
  providers: [
    ExpensesService, QuotationsService, PurchaseOrdersService,
    SupplierInvoicesService, LayawaysService, WorkOrdersService,
    SalesOrdersService, HeldReceiptsService, SettingsService, AuditLogsService,
  ],
  exports: [AuditLogsService, SettingsService],
})
export class TransactionalModule {}
