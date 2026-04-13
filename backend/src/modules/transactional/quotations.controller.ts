import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

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
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  // Fix 2 — Approve: manager/admin only, cloud event
  @Post(':id/approve')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Approve a quotation (locks record, records approver)' })
  approve(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
  ) {
    return this.svc.approve(id, approverId);
  }

  // Fix 2 — Reject
  @Post(':id/reject')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reject a quotation with a reason' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.svc.reject(id, reason);
  }

  // Fix 2 — Delete guard: only Draft
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
