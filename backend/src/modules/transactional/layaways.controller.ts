import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LayawaysService } from './layaways.service';

@ApiTags('layaways')
@Controller('layaways')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LayawaysController {
  constructor(private svc: LayawaysService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string, @Query('page') page = '1', @Query('limit') limit = '100') {
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
}
