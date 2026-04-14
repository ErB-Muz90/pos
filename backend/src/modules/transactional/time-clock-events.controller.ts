import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantResourceGuard, TenantModel } from '../../common/guards/tenant-resource.guard';
import { TimeClockEventsService } from './time-clock-events.service';

@ApiTags('time-clock-events')
@Controller('time-clock-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TimeClockEventsController {
  constructor(private svc: TimeClockEventsService) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '200',
  ) {
    return this.svc.findAll(orgId, +page, +limit);
  }

  @Post('clock-in')
  clockIn(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.clockIn(orgId, dto);
  }

  // Alias: frontend posts to /time-clock-events (no sub-path)
  @Post()
  clockInAlias(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.clockIn(orgId, dto);
  }

  @Post(':id/clock-out')
  @UseGuards(TenantResourceGuard)
  @TenantModel('timeClockEvent')
  clockOut(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.clockOut(id, dto, orgId);
  }

  @Put(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('timeClockEvent')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('organizationId') orgId: string) {
    return this.svc.update(id, dto, orgId);
  }

  @Delete(':id')
  @UseGuards(TenantResourceGuard)
  @TenantModel('timeClockEvent')
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.svc.remove(id, orgId);
  }
}
