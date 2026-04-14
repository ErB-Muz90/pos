import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import * as bcrypt from 'bcrypt';

const PLAN_LIMITS: Record<string, { maxUsers: number; maxBranches: number }> = {
  starter: { maxUsers: 5, maxBranches: 1 },
  professional: { maxUsers: 20, maxBranches: 3 },
  enterprise: { maxUsers: 100, maxBranches: 10 },
};

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    // Check if tax PIN already exists
    const existing = await this.prisma.organization.findUnique({
      where: { taxPin: createOrganizationDto.taxPin },
    });

    if (existing) {
      throw new ConflictException('Organization with this Tax PIN already exists');
    }

    const subscriptionTier = createOrganizationDto.subscriptionTier || 'starter';
    const limits = this.getPlanLimits(subscriptionTier);
    const wantsAdminProvisioning =
      !!createOrganizationDto.branchName ||
      !!createOrganizationDto.adminUsername ||
      !!createOrganizationDto.adminEmail ||
      !!createOrganizationDto.adminPassword ||
      !!createOrganizationDto.adminFullName;

    if (
      wantsAdminProvisioning &&
      (!createOrganizationDto.branchName ||
        !createOrganizationDto.adminUsername ||
        !createOrganizationDto.adminEmail ||
        !createOrganizationDto.adminPassword ||
        !createOrganizationDto.adminFullName)
    ) {
      throw new BadRequestException(
        'branchName, adminUsername, adminEmail, adminPassword, and adminFullName are all required when provisioning a tenant admin.',
      );
    }

    if (createOrganizationDto.adminUsername) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: createOrganizationDto.adminUsername },
        select: { id: true },
      });
      if (existingUsername) {
        throw new ConflictException('Admin username already exists');
      }
    }

    if (createOrganizationDto.adminEmail) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: createOrganizationDto.adminEmail },
        select: { id: true },
      });
      if (existingEmail) {
        throw new ConflictException('Admin email already exists');
      }
    }

    if (createOrganizationDto.branchCode) {
      const existingBranchCode = await this.prisma.branch.findFirst({
        where: { code: createOrganizationDto.branchCode },
        select: { id: true },
      });
      if (existingBranchCode) {
        throw new ConflictException('Branch with this code already exists');
      }
    }

    const maxBranches = createOrganizationDto.maxBranches ?? limits.maxBranches;
    const maxUsers = createOrganizationDto.maxUsers ?? limits.maxUsers;
    const subscriptionStatus =
      createOrganizationDto.subscriptionStatus ||
      (createOrganizationDto.subscriptionTier ? 'active' : 'trial');
    const subscriptionExpiresAt =
      subscriptionStatus === 'expired'
        ? new Date()
        : new Date(
            Date.now() +
              (subscriptionStatus === 'trial' ? 30 : 30) * 24 * 60 * 60 * 1000,
          );

    const baseOrgData = {
      name: createOrganizationDto.name,
      businessType: createOrganizationDto.businessType,
      taxPin: createOrganizationDto.taxPin,
      physicalAddress: createOrganizationDto.physicalAddress,
      phone: createOrganizationDto.phone,
      email: createOrganizationDto.email,
      etimsEnvironment: createOrganizationDto.etimsEnvironment,
      etimsBhfId: createOrganizationDto.etimsBhfId,
      etimsDeviceSerial: createOrganizationDto.etimsDeviceSerial,
      etimsTin: createOrganizationDto.etimsTin,
      subscriptionTier,
      subscriptionStatus,
      subscriptionExpiresAt,
      maxBranches,
      maxUsers,
      status: createOrganizationDto.status || 'active',
    };

    if (!wantsAdminProvisioning) {
      return this.prisma.organization.create({
        data: baseOrgData,
        include: {
          branches: true,
        },
      });
    }

    const passwordHash = await bcrypt.hash(createOrganizationDto.adminPassword!, 10);

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: baseOrgData,
      });

      const branch = await tx.branch.create({
        data: {
          organizationId: org.id,
          name: createOrganizationDto.branchName!,
          code:
            createOrganizationDto.branchCode ||
            `BR-${org.id.slice(0, 6).toUpperCase()}`,
          isPrimary: true,
        },
      });

      await tx.user.create({
        data: {
          organizationId: org.id,
          branchId: branch.id,
          username: createOrganizationDto.adminUsername!,
          email: createOrganizationDto.adminEmail!,
          fullName: createOrganizationDto.adminFullName!,
          passwordHash,
          role: 'admin',
          permissions: {},
        },
      });

      return tx.organization.findUniqueOrThrow({
        where: { id: org.id },
        include: {
          branches: true,
        },
      });
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: { deletedAt: null },
        include: {
          branches: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              code: true,
              isPrimary: true,
              status: true,
            },
          },
          _count: {
            select: {
              users: true,
              branches: true,
              products: true,
              sales: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: organizations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        branches: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        _count: {
          select: {
            users: true,
            branches: true,
            products: true,
            customers: true,
            sales: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // Verify organization exists
    await this.findOne(id);

    // If updating tax PIN, check for conflicts
    if (updateOrganizationDto.taxPin) {
      const existing = await this.prisma.organization.findFirst({
        where: {
          taxPin: updateOrganizationDto.taxPin,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Another organization with this Tax PIN already exists');
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: {
        branches: {
          where: { deletedAt: null },
        },
      },
    });

    if (updateOrganizationDto.status && updateOrganizationDto.status !== 'active') {
      await this.invalidateOrganizationSessions(id);
    }

    return updated;
  }

  async remove(id: string) {
    // Verify organization exists
    await this.findOne(id);

    const deletedAt = new Date();

    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        status: 'suspended',
        subscriptionStatus: 'expired',
        deletedAt,
      },
    });

    await this.prisma.user.updateMany({
      where: { organizationId: id, deletedAt: null },
      data: {
        status: 'inactive',
        deletedAt,
      },
    });

    await this.invalidateOrganizationSessions(id);

    return organization;
  }

  async updateSubscription(
    id: string,
    tier: string,
    status: string,
    expiresAt?: Date,
  ) {
    await this.findOne(id);

    const limits = this.getPlanLimits(tier);

    return this.prisma.organization.update({
      where: { id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
        maxUsers: limits.maxUsers,
        maxBranches: limits.maxBranches,
      },
    });
  }

  async getStats(id: string) {
    const organization = await this.findOne(id);

    const [
      totalUsers,
      totalBranches,
      totalProducts,
      totalCustomers,
      totalSales,
      recentSales,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { organizationId: id, deletedAt: null },
      }),
      this.prisma.branch.count({
        where: { organizationId: id, deletedAt: null },
      }),
      this.prisma.product.count({
        where: { organizationId: id, deletedAt: null },
      }),
      this.prisma.customer.count({
        where: { organizationId: id, deletedAt: null },
      }),
      this.prisma.sale.count({
        where: { organizationId: id, status: 'completed' },
      }),
      this.prisma.sale.aggregate({
        where: {
          organizationId: id,
          status: 'completed',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        taxPin: organization.taxPin,
        subscriptionTier: organization.subscriptionTier,
        subscriptionStatus: organization.subscriptionStatus,
        subscriptionExpiresAt: organization.subscriptionExpiresAt,
      },
      stats: {
        users: {
          total: totalUsers,
          limit: organization.maxUsers,
          remaining: organization.maxUsers - totalUsers,
        },
        branches: {
          total: totalBranches,
          limit: organization.maxBranches,
          remaining: organization.maxBranches - totalBranches,
        },
        products: totalProducts,
        customers: totalCustomers,
        sales: {
          total: totalSales,
          last30Days: recentSales._count,
          revenue30Days: recentSales._sum.totalAmount || 0,
        },
      },
    };
  }

  /** Platform-wide metrics for super admin dashboard */
  async getPlatformDashboard() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrgs,
      activeOrgs,
      trialOrgs,
      expiredOrgs,
      newOrgsLast30Days,
      totalUsers,
      totalSalesLast30Days,
      revenueByTier,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'active' } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'trial' } }),
      this.prisma.organization.count({ where: { deletedAt: null, subscriptionStatus: 'expired' } }),
      this.prisma.organization.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { deletedAt: null, role: { not: 'superadmin' } } }),
      this.prisma.sale.count({ where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.organization.groupBy({
        by: ['subscriptionTier'],
        where: { deletedAt: null },
        _count: true,
      }),
    ]);

    return {
      orgs: { total: totalOrgs, active: activeOrgs, trial: trialOrgs, expired: expiredOrgs, newLast30Days: newOrgsLast30Days },
      users: { total: totalUsers },
      sales: { last30Days: totalSalesLast30Days },
      byTier: revenueByTier.map((r) => ({ tier: r.subscriptionTier, count: r._count })),
    };
  }

  private getPlanLimits(plan: string) {
    return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
  }

  private async invalidateOrganizationSessions(organizationId: string) {
    await this.prisma.userSession.updateMany({
      where: {
        isValid: true,
        user: {
          organizationId,
        },
      },
      data: {
        isValid: false,
        lastActivityAt: new Date(),
      },
    });
  }
}
