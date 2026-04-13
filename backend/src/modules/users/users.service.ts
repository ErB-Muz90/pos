import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createUserDto: CreateUserDto) {
    // Check if username already exists in organization
    const existingUsername = await this.prisma.user.findFirst({
      where: {
        organizationId,
        username: createUserDto.username,
        deletedAt: null,
      },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists (if provided)
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          organizationId,
          email: createUserDto.email,
          deletedAt: null,
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check user limit
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization._count.users >= organization.maxUsers) {
      throw new BadRequestException(
        `User limit reached. Maximum ${organization.maxUsers} users allowed.`,
      );
    }

    // Verify branch exists if provided
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: createUserDto.branchId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Hash password and PIN
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const pinHash = createUserDto.pin
      ? await bcrypt.hash(createUserDto.pin, 10)
      : null;

    // Set default permissions based on role if not provided
    const permissions = createUserDto.permissions || this.getDefaultPermissions(createUserDto.role);

    const { password, pin, ...userData } = createUserDto;

    return this.prisma.user.create({
      data: {
        ...userData,
        organizationId,
        passwordHash,
        pinHash,
        permissions,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        employeeCode: true,
        branchId: true,
        permissions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          employeeCode: true,
          branchId: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        employeeCode: true,
        branchId: true,
        permissions: true,
        mfaEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        passwordChangedAt: true,
        forcePasswordChange: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, organizationId: string, updateUserDto: UpdateUserDto) {
    // Verify user exists
    await this.findOne(id, organizationId);

    // Check username conflict if updating
    if (updateUserDto.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          organizationId,
          username: updateUserDto.username,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Username already exists');
      }
    }

    // Check email conflict if updating
    if (updateUserDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          organizationId,
          email: updateUserDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    // Verify branch exists if updating
    if (updateUserDto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: updateUserDto.branchId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    // Hash PIN if provided
    const pinHash = updateUserDto.pin
      ? await bcrypt.hash(updateUserDto.pin, 10)
      : undefined;

    const { pin, ...updateData } = updateUserDto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(pinHash && { pinHash }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        employeeCode: true,
        branchId: true,
        permissions: true,
        status: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    // Verify user exists
    await this.findOne(id, organizationId);

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updatePermissions(
    id: string,
    organizationId: string,
    permissions: Record<string, any>,
  ) {
    // Verify user exists
    await this.findOne(id, organizationId);

    return this.prisma.user.update({
      where: { id },
      data: { permissions },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        permissions: true,
      },
    });
  }

  async resetPassword(id: string, organizationId: string, newPassword: string) {
    // Verify user exists
    await this.findOne(id, organizationId);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        forcePasswordChange: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async toggleStatus(id: string, organizationId: string) {
    const user = await this.findOne(id, organizationId);

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        username: true,
        fullName: true,
        status: true,
      },
    });
  }

  async unlockAccount(id: string, organizationId: string) {
    // Verify user exists
    await this.findOne(id, organizationId);

    return this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Get default permissions based on role
   */
  private getDefaultPermissions(role: string): Record<string, any> {
    const permissionTemplates = {
      admin: {}, // Admin has all permissions by default
      manager: {
        sales: { create: true, read: true, update: true, void: true },
        products: { create: true, read: true, update: true },
        inventory: { create: true, read: true, update: true },
        customers: { create: true, read: true, update: true, delete: true },
        reports: { read: true, export: true },
        users: { read: true },
      },
      cashier: {
        sales: { create: true, read: true },
        products: { read: true },
        customers: { create: true, read: true },
        inventory: { read: true },
      },
      accountant: {
        sales: { read: true },
        expenses: { create: true, read: true, update: true },
        accounting: { create: true, read: true, update: true },
        reports: { read: true, export: true },
      },
    };

    return permissionTemplates[role] || {};
  }
}
