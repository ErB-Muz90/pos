import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const notImplemented = (resource: string) => {
  throw new NotImplementedException(
    `${resource} backend support is not implemented yet.`,
  );
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('purchase-orders')
export class PurchaseOrdersCompatController {
  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Purchase orders');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Purchase orders');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('supplier-invoices')
export class SupplierInvoicesCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post(':id/payment')
  recordPayment(@Param('id') _id: string) {
    return notImplemented('Supplier invoices');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('quotations')
export class QuotationsCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Quotations');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Quotations');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('settings')
export class SettingsCompatController {
  @Get()
  getSettings() {
    return {};
  }

  @Post()
  updateSettings(@Body() _body: Record<string, unknown>) {
    return notImplemented('Settings');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('audit-logs')
export class AuditLogsCompatController {
  @Get()
  findAll() {
    return [];
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('shifts')
export class ShiftsCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Shifts');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Shifts');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('time-clock-events')
export class TimeClockEventsCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Time clock events');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Time clock events');
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return notImplemented('Time clock events');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('payouts')
export class PayoutsCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Payouts');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('layaways')
export class LayawaysCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Layaways');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('work-orders')
export class WorkOrdersCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Work orders');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Work orders');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('sales-orders')
export class SalesOrdersCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Sales orders');
  }

  @Put(':id')
  update(@Param('id') _id: string) {
    return notImplemented('Sales orders');
  }

  @Post(':id/create-po')
  createPurchaseOrder(@Param('id') _id: string) {
    return notImplemented('Sales orders');
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('compat')
@Controller('held-receipts')
export class HeldReceiptsCompatController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return notImplemented('Held receipts');
  }

  @Delete(':id')
  remove(@Param('id') _id: string) {
    return notImplemented('Held receipts');
  }
}
