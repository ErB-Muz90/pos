import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';
import { SupplierInvoicesService } from './supplier-invoices.service';

@ApiTags('supplier-invoices')
@Controller('supplier-invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SupplierInvoicesController {
  constructor(private svc: SupplierInvoicesService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query('page') page = '1', @Query('limit') limit = '100') {
    return this.svc.findAll(orgId, +page, +limit);
  }

  @Post()
  create(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.create(orgId, dto);
  }

  @Put(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('supplierInvoice')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.update(id, dto, orgId);
  }

  @Post(':id/payment')
  @UseGuards(TenantResourceGuard)
  @TenantModel('supplierInvoice')
  recordPayment(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.recordPayment(id, dto, orgId);
  }
}
