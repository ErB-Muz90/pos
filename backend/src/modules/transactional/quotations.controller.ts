import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';

@ApiTags('quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class QuotationsController {
  constructor(private svc: QuotationsService) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    return this.svc.findAll(orgId, +page, +limit);
  }

  @Post()
  create(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.create(orgId, dto);
  }

  @Put(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('quotation')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.update(id, dto, orgId);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager')
  @UseGuards(TenantResourceGuard)
  @TenantModel('quotation')
  @ApiOperation({ summary: 'Approve a quotation (locks record, records approver)' })
  approve(@Param('id') id: string, @CurrentUser('id') approverId: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.approve(id, approverId, orgId);
  }

  @Post(':id/reject')
  @Roles('admin', 'manager')
  @UseGuards(TenantResourceGuard)
  @TenantModel('quotation')
  @ApiOperation({ summary: 'Reject a quotation with a reason' })
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.reject(id, reason, orgId);
  }

  @Delete(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('quotation')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.remove(id, orgId);
  }
}
