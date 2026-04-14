import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';
import { HeldReceiptsService } from './held-receipts.service';

@ApiTags('held-receipts')
@Controller('held-receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class HeldReceiptsController {
  constructor(private svc: HeldReceiptsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Post()
  create(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.create(orgId, dto);
  }

  @Delete(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('heldReceipt')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.remove(id, orgId);
  }
}
