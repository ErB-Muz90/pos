import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createBranchDto: CreateBranchDto) {
    // Check if code already exists in organization
    const existing = await this.prisma.branch.findFirst({
      where: {
        organizationId,
        code: createBranchDto.code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Branch with this code already exists');
    }

    // Check branch limit
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { branches: { where: { deletedAt: null } } },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization._count.branches >= organization.maxBranches) {
      throw new BadRequestException(
        `Branch limit reached. Maximum ${organization.maxBranches} branches allowed.`,
      );
    }

    // If this is the first branch, make it primary
    const isFirstBranch = organization._count.branches === 0;

    return this.prisma.branch.create({
      data: {
        ...createBranchDto,
        organizationId,
        isPrimary: isFirstBranch || createBranchDto.isPrimary || false,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.branch.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
            sales: true,
            branchInventory: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            taxPin: true,
          },
        },
        _count: {
          select: {
            users: true,
            sales: true,
            branchInventory: true,
            shifts: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(
    id: string,
    organizationId: string,
    updateBranchDto: UpdateBranchDto,
  ) {
    // Verify branch exists
    await this.findOne(id, organizationId);

    // If updating code, check for conflicts
    if (updateBranchDto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: {
          organizationId,
          code: updateBranchDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Another branch with this code already exists');
      }
    }

    // If setting as primary, unset other primary branches
    if (updateBranchDto.isPrimary) {
      await this.prisma.branch.updateMany({
        where: {
          organizationId,
          id: { not: id },
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async remove(id: string, organizationId: string) {
    const branch = await this.findOne(id, organizationId);

    // Don't allow deleting primary branch if there are other branches
    if (branch.isPrimary) {
      const otherBranches = await this.prisma.branch.count({
        where: {
          organizationId,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (otherBranches > 0) {
        throw new BadRequestException(
          'Cannot delete primary branch. Set another branch as primary first.',
        );
      }
    }

    // Soft delete
    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async setPrimary(id: string, organizationId: string) {
    // Verify branch exists
    await this.findOne(id, organizationId);

    // Unset all other primary branches
    await this.prisma.branch.updateMany({
      where: {
        organizationId,
        id: { not: id },
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    // Set this branch as primary
    return this.prisma.branch.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async getStats(id: string, organizationId: string) {
    const branch = await this.findOne(id, organizationId);

    const [totalUsers, totalSales, totalInventoryItems, recentSales] =
      await Promise.all([
        this.prisma.user.count({
          where: { branchId: id, deletedAt: null },
        }),
        this.prisma.sale.count({
          where: { branchId: id, status: 'completed' },
        }),
        this.prisma.branchInventory.count({
          where: { branchId: id },
        }),
        this.prisma.sale.aggregate({
          where: {
            branchId: id,
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
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        isPrimary: branch.isPrimary,
        status: branch.status,
      },
      stats: {
        users: totalUsers,
        inventoryItems: totalInventoryItems,
        sales: {
          total: totalSales,
          last30Days: recentSales._count,
          revenue30Days: recentSales._sum.totalAmount || 0,
        },
      },
    };
  }
}
