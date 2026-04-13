import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

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

    return this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      include: {
        branches: true,
      },
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

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: {
        branches: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async remove(id: string) {
    // Verify organization exists
    await this.findOne(id);

    // Soft delete
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateSubscription(
    id: string,
    tier: string,
    status: string,
    expiresAt?: Date,
  ) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
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
}
