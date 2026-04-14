import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ExpensesController {
  constructor(private svc: ExpensesService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query('page') page = '1', @Query('limit') limit = '100') {
    return this.svc.findAll(orgId, +page, +limit);
  }

  @Post()
  create(@CurrentUser('organizationId') orgId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.svc.create(orgId, userId, dto);
  }

  @Put(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('expense')
  update(@Param('id') id: string, @CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.update(id, orgId, dto);
  }

  @Delete(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('expense')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.remove(id, orgId);
  }
}
