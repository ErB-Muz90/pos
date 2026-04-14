import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private svc: SettingsService) {}

  @Get()
  get(@CurrentUser('organizationId') orgId: string) {
    return this.svc.get(orgId);
  }

  /** Full replace */
  @Post()
  upsert(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.upsert(orgId, dto);
  }

  /** Partial merge — only the keys sent are updated */
  @Put()
  patch(@CurrentUser('organizationId') orgId: string, @Body() dto: any) {
    return this.svc.patch(orgId, dto);
  }
}
