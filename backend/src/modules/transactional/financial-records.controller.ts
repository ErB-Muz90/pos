import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FinancialRecordsService } from './financial-records.service';

@ApiTags('financial-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller()
export class FinancialRecordsController {
  constructor(private svc: FinancialRecordsService) {}

  @Get('supplier-payments')
  getSupplierPayments(@CurrentUser('organizationId') orgId: string) { return this.svc.getSupplierPayments(orgId); }
  @Post('supplier-payments')
  createSupplierPayment(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createSupplierPayment(orgId, dto); }
  @Put('supplier-payments/:id')
  updateSupplierPayment(@Param('id') id: string, @CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.updateSupplierPayment(id, orgId, dto); }
  @Delete('supplier-payments/:id')
  deleteSupplierPayment(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) { return this.svc.deleteSupplierPayment(id, orgId); }

  @Get('bank-deposits')
  getBankDeposits(@CurrentUser('organizationId') orgId: string) { return this.svc.getBankDeposits(orgId); }
  @Post('bank-deposits')
  createBankDeposit(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createBankDeposit(orgId, dto); }
  @Put('bank-deposits/:id')
  updateBankDeposit(@Param('id') id: string, @CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.updateBankDeposit(id, orgId, dto); }

  @Get('bank-withdrawals')
  getBankWithdrawals(@CurrentUser('organizationId') orgId: string) { return this.svc.getBankWithdrawals(orgId); }
  @Post('bank-withdrawals')
  createBankWithdrawal(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createBankWithdrawal(orgId, dto); }
  @Put('bank-withdrawals/:id')
  updateBankWithdrawal(@Param('id') id: string, @CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.updateBankWithdrawal(id, orgId, dto); }

  @Get('stock-movements')
  getStockMovements(@CurrentUser('organizationId') orgId: string) { return this.svc.getStockMovements(orgId); }
  @Post('stock-movements')
  createStockMovement(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createStockMovement(orgId, dto); }

  @Get('work-order-materials')
  getWorkOrderMaterials(@CurrentUser('organizationId') orgId: string, @Query('workOrderId') workOrderId?: string) { return this.svc.getWorkOrderMaterials(orgId, workOrderId); }
  @Post('work-order-materials')
  createWorkOrderMaterial(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createWorkOrderMaterial(orgId, dto); }
  @Put('work-order-materials/:id')
  updateWorkOrderMaterial(@Param('id') id: string, @CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.updateWorkOrderMaterial(id, orgId, dto); }
  @Delete('work-order-materials/:id')
  deleteWorkOrderMaterial(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) { return this.svc.deleteWorkOrderMaterial(id, orgId); }

  @Get('accounts')
  getAccounts(@CurrentUser('organizationId') orgId: string) { return this.svc.getAccounts(orgId); }
  @Post('accounts')
  upsertAccount(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.upsertAccount(orgId, dto); }

  @Get('accounting-transactions')
  getAccountingTransactions(@CurrentUser('organizationId') orgId: string) { return this.svc.getAccountingTransactions(orgId); }
  @Post('accounting-transactions')
  createAccountingTransaction(@CurrentUser('organizationId') orgId: string, @Body() dto: any) { return this.svc.createAccountingTransaction(orgId, dto); }
}
