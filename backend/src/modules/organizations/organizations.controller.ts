import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ── Super-admin only ─────────────────────────────────────────────────────

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create organization (super admin only)' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'List all organizations (super admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.organizationsService.findAll(+page, +limit);
  }

  @Get(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get any organization by ID (super admin only)' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update any organization (super admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Soft-delete an organization (super admin only)' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/stats')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get organization stats (super admin only)' })
  getStats(@Param('id') id: string) {
    return this.organizationsService.getStats(id);
  }

  @Patch(':id/subscription')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update subscription (super admin only)' })
  updateSubscription(
    @Param('id') id: string,
    @Body() body: { tier: string; status: string; expiresAt?: Date },
  ) {
    return this.organizationsService.updateSubscription(id, body.tier, body.status, body.expiresAt);
  }

  @Get('platform/dashboard')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Platform-wide metrics (super admin only)' })
  getPlatformDashboard() {
    return this.organizationsService.getPlatformDashboard();
  }

  // ── Org-scoped (any authenticated user) ─────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get own organization' })
  findMine(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationsService.findOne(organizationId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get own organization stats' })
  getMyStats(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationsService.getStats(organizationId);
  }
}
