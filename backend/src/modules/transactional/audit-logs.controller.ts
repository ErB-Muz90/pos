import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AuditLogsController {
  constructor(private svc: AuditLogsService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query('page') page = '1', @Query('limit') limit = '100') {
    return this.svc.findAll(orgId, +page, +limit);
  }
}
