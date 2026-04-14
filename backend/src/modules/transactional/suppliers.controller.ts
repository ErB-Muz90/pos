import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SuppliersController {
  constructor(private svc: SuppliersService) {}

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
  @TenantModel('supplier')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.update(id, dto, orgId);
  }

  @Delete(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('supplier')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.remove(id, orgId);
  }
}
