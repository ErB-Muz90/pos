import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SuperAdminService } from './super-admin.service';

@ApiTags('super-admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth('JWT-auth')
export class SuperAdminController {
  constructor(private svc: SuperAdminService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────
  @Get('dashboard')
  dashboard() { return this.svc.getDashboard(); }

  // ── Tenants ───────────────────────────────────────────────────────────
  @Get('orgs')
  listOrgs(@Query('page') page = '1', @Query('limit') limit = '20', @Query('search') search?: string, @Query('status') status?: string, @Query('tier') tier?: string) {
    return this.svc.listOrgs(+page, +limit, search, status, tier);
  }

  @Get('orgs/:id')
  getOrg(@Param('id') id: string) { return this.svc.getOrgDetail(id); }

  @Patch('orgs/:id/subscription')
  updateSub(
    @Param('id') id: string,
    @Body() body: { tier: string; status: string; months: number },
    @CurrentUser('id') adminId: string,
    @CurrentUser('username') adminUsername: string,
    @CurrentUser('permissions') permissions: Record<string, any>,
    @Ip() ip: string,
  ) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, adminUsername, 'CHANGE_SUBSCRIPTION', 'organization', id, body, ip);
    return this.svc.updateSubscription(id, body.tier, body.status, body.months ?? 1);
  }

  @Patch('orgs/:id/suspend')
  suspend(@Param('id') id: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'SUSPEND_ORG', 'organization', id, {}, ip);
    return this.svc.suspendOrg(id);
  }

  @Patch('orgs/:id/unsuspend')
  unsuspend(@Param('id') id: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'UNSUSPEND_ORG', 'organization', id, {}, ip);
    return this.svc.unsuspendOrg(id);
  }

  @Delete('orgs/:id')
  deleteOrg(@Param('id') id: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'DELETE_ORG', 'organization', id, {}, ip);
    return this.svc.deleteOrg(id);
  }

  @Post('orgs/:id/impersonate')
  impersonate(@Param('id') id: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    return this.svc.impersonate(id, adminId, u, ip);
  }

  // ── Plans ─────────────────────────────────────────────────────────────
  @Get('plans')
  listPlans() { return this.svc.listPlans(); }

  @Post('plans')
  upsertPlan(@Body() body: any, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'UPSERT_PLAN', 'plan', body.name, body, ip);
    return this.svc.upsertPlan(body);
  }

  @Delete('plans/:name')
  deletePlan(@Param('name') name: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'DELETE_PLAN', 'plan', name, {}, ip);
    return this.svc.deletePlan(name);
  }

  // ── Feature Flags ─────────────────────────────────────────────────────
  @Get('feature-flags')
  listFlags() { return this.svc.listFlags(); }

  @Post('feature-flags')
  createFlag(
    @Body() body: { key: string; label: string; enabledForTiers?: string[]; orgOverrides?: Record<string, boolean> },
    @CurrentUser('id') adminId: string,
    @CurrentUser('username') u: string,
    @CurrentUser('permissions') permissions: Record<string, any>,
    @Ip() ip: string,
  ) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'CREATE_FEATURE_FLAG', 'feature_flag', body.key, body, ip);
    return this.svc.createFlag(body);
  }

  @Patch('feature-flags/:key')
  updateFlag(
    @Param('key') key: string,
    @Body() body: { enabledForTiers: string[]; orgOverrides: Record<string, boolean> },
    @CurrentUser('id') adminId: string,
    @CurrentUser('username') u: string,
    @CurrentUser('permissions') permissions: Record<string, any>,
    @Ip() ip: string,
  ) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'UPDATE_FEATURE_FLAG', 'feature_flag', key, body, ip);
    return this.svc.updateFlag(key, body.enabledForTiers, body.orgOverrides);
  }

  // ── Platform Settings ─────────────────────────────────────────────────
  @Get('settings')
  getSettings() { return this.svc.getSettings(); }

  @Post('settings')
  setSetting(@Body() body: { key: string; value: string }, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'UPDATE_PLATFORM_SETTING', 'setting', body.key, { value: body.value }, ip);
    return this.svc.setSetting(body.key, body.value, adminId);
  }

  // ── Audit Log ─────────────────────────────────────────────────────────
  @Get('audit-log')
  auditLog(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.svc.getAuditLog(+page, +limit);
  }

  // ── SA Users ──────────────────────────────────────────────────────────
  @Get('admins')
  listAdmins() { return this.svc.listSuperAdmins(); }

  @Post('admins')
  createAdmin(@Body() body: { username: string; email: string; fullName?: string; password: string; accessLevel: 'full_access' | 'read_only' }, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'CREATE_SUPER_ADMIN', 'user', body.username, { email: body.email, accessLevel: body.accessLevel }, ip);
    return this.svc.createSuperAdmin(body);
  }

  @Patch('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() body: { username?: string; fullName?: string; email?: string; accessLevel?: 'full_access' | 'read_only' }, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'UPDATE_SUPER_ADMIN', 'user', id, body, ip);
    return this.svc.updateSuperAdmin(id, body);
  }

  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @CurrentUser('permissions') permissions: Record<string, any>, @Ip() ip: string) {
    this.svc.assertWriteAccess(permissions);
    this.svc.audit(adminId, u, 'DELETE_SUPER_ADMIN', 'user', id, {}, ip);
    return this.svc.deleteSuperAdmin(id, adminId);
  }

  @Post('admins/change-password')
  changeOwnPassword(@Body() body: { currentPassword: string; newPassword: string }, @CurrentUser('id') adminId: string, @CurrentUser('username') u: string, @Ip() ip: string) {
    this.svc.audit(adminId, u, 'CHANGE_SUPER_ADMIN_PASSWORD', 'user', adminId, {}, ip);
    return this.svc.changeSuperAdminPassword(adminId, body.currentPassword, body.newPassword);
  }
}
