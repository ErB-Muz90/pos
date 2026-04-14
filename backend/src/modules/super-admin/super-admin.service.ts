import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── Audit helper ────────────────────────────────────────────────────────
  async audit(adminId: string, adminUsername: string, action: string, targetType?: string, targetId?: string, details?: any, ip?: string) {
    await (this.prisma as any).superAdminAuditLog.create({
      data: { id: require('crypto').randomUUID(), adminId, adminUsername, action, targetType, targetId, details, ipAddress: ip },
    });
  }

  assertWriteAccess(permissions: Record<string, any> | undefined | null) {
    const level = permissions?.superAdminAccess || 'full_access';
    if (level !== 'full_access') {
      throw new ForbiddenException('Read-only super admin cannot perform this action');
    }
  }

  private validateRealEmail(email: string) {
    const value = String(email || '').trim().toLowerCase();
    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!basicEmailPattern.test(value)) {
      throw new BadRequestException('Enter a valid email address');
    }

    const [, domain = ''] = value.split('@');
    const blockedDomains = new Set([
      'example.com',
      'example.org',
      'example.net',
      'test.com',
      'mailinator.com',
      'tempmail.com',
      'yopmail.com',
      'guerrillamail.com',
      '10minutemail.com',
      'sharklasers.com',
      'discard.email',
      'banduka.local',
      'localhost',
    ]);
    const blockedDomainFragments = [
      'tempmail',
      'mailinator',
      'guerrilla',
      '10minute',
      'disposable',
      'throwaway',
      'fake',
      'dummy',
      'invalid',
      'testmail',
    ];

    if (blockedDomains.has(domain) || blockedDomainFragments.some((item) => domain.includes(item))) {
      throw new BadRequestException('Use a real email address. Dummy or disposable emails are not allowed');
    }

    return value;
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  async getDashboard() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalOrgs, activeOrgs, trialOrgs, expiredOrgs, newOrgs, totalUsers, salesLast30, byTier] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'active' } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'trial' } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'expired' } }),
      this.prisma.organization.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { deletedAt: null, role: { not: 'superadmin' } } }),
      this.prisma.sale.aggregate({ where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.organization.groupBy({ by: ['subscriptionTier'], where: { deletedAt: null }, _count: true }),
    ]);
    return {
      orgs: { total: totalOrgs, active: activeOrgs, trial: trialOrgs, expired: expiredOrgs, newLast30Days: newOrgs },
      users: { total: totalUsers },
      revenue: { salesLast30Days: salesLast30._count, amountLast30Days: salesLast30._sum.totalAmount ?? 0 },
      byTier: byTier.map(r => ({ tier: r.subscriptionTier, count: r._count })),
    };
  }

  // ── Tenants ──────────────────────────────────────────────────────────────
  async listOrgs(page = 1, limit = 20, search?: string, status?: string, tier?: string) {
    const where: any = { deletedAt: null };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { taxPin: { contains: search } }];
    if (status) where.subscriptionStatus = status;
    if (tier) where.subscriptionTier = tier;
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { _count: { select: { users: true, branches: true, sales: true } } } }),
      this.prisma.organization.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getOrgDetail(id: string) {
    const org = await this.prisma.organization.findFirst({ where: { id, deletedAt: null },
      include: { branches: { where: { deletedAt: null } }, _count: { select: { users: true, branches: true, products: true, customers: true, sales: true } } } });
    if (!org) throw new NotFoundException('Organization not found');
    const revenue = await this.prisma.sale.aggregate({ where: { organizationId: id, status: 'completed' }, _sum: { totalAmount: true }, _count: true });
    return { ...org, revenue: { total: revenue._count, amount: revenue._sum.totalAmount ?? 0 } };
  }

  async updateSubscription(orgId: string, tier: string, status: string, months: number) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const plan = await (this.prisma as any).plan.findUnique({ where: { name: tier } });
    return this.prisma.organization.update({ where: { id: orgId }, data: {
      subscriptionTier: tier, subscriptionStatus: status, subscriptionExpiresAt: expiresAt,
      maxUsers: plan?.maxUsers ?? 5, maxBranches: plan?.maxBranches ?? 1,
    }});
  }

  async suspendOrg(orgId: string) {
    return this.prisma.organization.update({ where: { id: orgId }, data: { status: 'suspended' } });
  }

  async unsuspendOrg(orgId: string) {
    return this.prisma.organization.update({ where: { id: orgId }, data: { status: 'active' } });
  }

  async deleteOrg(orgId: string) {
    return this.prisma.organization.update({ where: { id: orgId }, data: { deletedAt: new Date(), status: 'deleted' } });
  }

  /** Impersonate: generate a short-lived JWT for the org's primary admin */
  async impersonate(orgId: string, adminId: string, adminUsername: string, ip?: string) {
    const admin = await this.prisma.user.findFirst({
      where: { organizationId: orgId, role: 'admin', status: 'active', deletedAt: null },
      include: { organization: true, branch: true },
    });
    if (!admin) throw new NotFoundException('No active admin found for this organization');
    const token = await this.jwt.signAsync(
      { sub: admin.id, username: admin.username, role: admin.role, organizationId: orgId, branchId: admin.branchId, impersonatedBy: adminId },
      { secret: this.config.get('JWT_SECRET'), expiresIn: '1h' },
    );
    await this.audit(adminId, adminUsername, 'IMPERSONATE', 'organization', orgId, { targetAdmin: admin.username }, ip);
    return { accessToken: token, expiresIn: '1h', targetAdmin: admin.username, organization: admin.organization?.name };
  }

  // ── Plans ────────────────────────────────────────────────────────────────
  async listPlans() {
    return (this.prisma as any).plan.findMany({ orderBy: { maxUsers: 'asc' } });
  }

  async upsertPlan(data: any) {
    const { name, priceLabel, ...rest } = data;
    const normalizedName = String(name || '').trim().toLowerCase();
    return (this.prisma as any).plan.upsert({
      where: { name: normalizedName },
      create: { id: require('crypto').randomUUID(), name: normalizedName, priceLabel: priceLabel || 'Custom', ...rest },
      update: { ...rest, priceLabel: priceLabel || 'Custom' },
    });
  }

  async deletePlan(name: string) {
    const normalized = String(name || '').trim().toLowerCase();
    const protectedPlans = new Set(['starter', 'professional', 'enterprise']);
    if (protectedPlans.has(normalized)) {
      throw new ForbiddenException('Core plans cannot be deleted');
    }

    const plan = await (this.prisma as any).plan.findUnique({ where: { name: normalized } });
    if (!plan) throw new NotFoundException('Plan not found');

    return (this.prisma as any).plan.delete({ where: { name: normalized } });
  }

  // ── Feature Flags ────────────────────────────────────────────────────────
  async listFlags() {
    return (this.prisma as any).featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async createFlag(data: { key: string; label: string; enabledForTiers?: string[]; orgOverrides?: Record<string, boolean> }) {
    const key = String(data.key || '').trim().toLowerCase();
    const label = String(data.label || '').trim();
    if (!key) throw new BadRequestException('Feature key is required');
    if (!label) throw new BadRequestException('Feature label is required');

    return (this.prisma as any).featureFlag.create({
      data: {
        id: require('crypto').randomUUID(),
        key,
        label,
        enabledForTiers: data.enabledForTiers || [],
        orgOverrides: data.orgOverrides || {},
      },
    });
  }

  async updateFlag(key: string, enabledForTiers: string[], orgOverrides: Record<string, boolean>) {
    return (this.prisma as any).featureFlag.update({ where: { key }, data: { enabledForTiers, orgOverrides } });
  }

  // ── Platform Settings ────────────────────────────────────────────────────
  async getSettings() {
    const rows = await (this.prisma as any).platformSetting.findMany();
    return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  }

  async setSetting(key: string, value: string, adminId: string) {
    return (this.prisma as any).platformSetting.upsert({
      where: { key },
      create: { key, value, updatedBy: adminId },
      update: { value, updatedBy: adminId },
    });
  }

  // ── SA Audit Log ─────────────────────────────────────────────────────────
  async getAuditLog(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      (this.prisma as any).superAdminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      (this.prisma as any).superAdminAuditLog.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── SA User Management ───────────────────────────────────────────────────
  async listSuperAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'superadmin', deletedAt: null },
      select: { id: true, username: true, email: true, fullName: true, status: true, lastLoginAt: true, createdAt: true, permissions: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSuperAdmin(data: { username: string; email: string; fullName?: string; password: string; accessLevel: 'full_access' | 'read_only' }) {
    if (!data.username?.trim()) throw new BadRequestException('Username is required');
    if (!data.email?.trim()) throw new BadRequestException('Email is required');
    if (!data.password || data.password.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const email = this.validateRealEmail(data.email);
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        username: data.username.trim(),
        email,
        fullName: data.fullName?.trim() || data.username.trim(),
        passwordHash,
        role: 'superadmin',
        status: 'active',
        organizationId: null,
        permissions: { superAdminAccess: data.accessLevel || 'full_access' },
      },
      select: { id: true, username: true, email: true, fullName: true, status: true, lastLoginAt: true, createdAt: true, permissions: true },
    });
  }

  async updateSuperAdmin(id: string, data: { username?: string; fullName?: string; email?: string; accessLevel?: 'full_access' | 'read_only' }) {
    const existing = await this.prisma.user.findFirst({ where: { id, role: 'superadmin', deletedAt: null } });
    if (!existing) throw new NotFoundException('Super admin user not found');

    const nextEmail = data.email?.trim() ? this.validateRealEmail(data.email) : existing.email;
    const nextUsername = data.username?.trim() || existing.username;

    const permissions = {
      ...(existing.permissions as Record<string, any> || {}),
      ...(data.accessLevel ? { superAdminAccess: data.accessLevel } : {}),
    };

    return this.prisma.user.update({
      where: { id },
      data: {
        username: nextUsername,
        fullName: data.fullName?.trim() || existing.fullName,
        email: nextEmail,
        permissions,
      },
      select: { id: true, username: true, email: true, fullName: true, status: true, lastLoginAt: true, createdAt: true, permissions: true },
    });
  }

  async deleteSuperAdmin(id: string, actingUserId: string) {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot delete your own active account');
    }

    const existing = await this.prisma.user.findFirst({ where: { id, role: 'superadmin', deletedAt: null } });
    if (!existing) throw new NotFoundException('Super admin user not found');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
  }

  async changeSuperAdminPassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'superadmin') {
      throw new NotFoundException('Super admin user not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        forcePasswordChange: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.prisma.userSession.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false, lastActivityAt: new Date() },
    });

    return { success: true };
  }
}
