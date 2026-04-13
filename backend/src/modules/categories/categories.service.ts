import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createCategoryDto: CreateCategoryDto) {
    // Check if code already exists (if provided)
    if (createCategoryDto.code) {
      const existing = await this.prisma.category.findFirst({
        where: {
          organizationId,
          code: createCategoryDto.code,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Category code already exists');
      }
    }

    // Verify parent category exists if provided
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        organizationId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.category.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
            imageUrl: true,
          },
        },
        products: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            status: true,
          },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    organizationId: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    // Verify category exists
    await this.findOne(id, organizationId);

    // Check code conflict if updating
    if (updateCategoryDto.code) {
      const existing = await this.prisma.category.findFirst({
        where: {
          organizationId,
          code: updateCategoryDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Category code already exists');
      }
    }

    // Verify parent category exists if updating
    if (updateCategoryDto.parentId) {
      // Prevent circular reference
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const category = await this.findOne(id, organizationId);

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Move or delete products first.',
      );
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first.',
      );
    }

    // Soft delete
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTree(organizationId: string) {
    // Get all categories
    const categories = await this.prisma.category.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    const categoryMap = new Map();
    const tree = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
