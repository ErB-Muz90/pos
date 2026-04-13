import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createProductDto: CreateProductDto) {
    // Check SKU uniqueness if provided
    if (createProductDto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          organizationId,
          sku: createProductDto.sku,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    // Check barcode uniqueness if provided
    if (createProductDto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          organizationId,
          barcode: createProductDto.barcode,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Product barcode already exists');
      }
    }

    // Verify category exists if provided
    if (createProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: createProductDto.categoryId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Verify parent product exists if this is a variant
    if (createProductDto.parentProductId) {
      const parent = await this.prisma.product.findFirst({
        where: {
          id: createProductDto.parentProductId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent product not found');
      }
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        organizationId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    categoryId?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          branchInventory: {
            select: {
              branchId: true,
              quantity: true,
              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            variantAttributes: true,
            status: true,
          },
        },
        branchInventory: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    organizationId: string,
    updateProductDto: UpdateProductDto,
  ) {
    // Verify product exists
    await this.findOne(id, organizationId);

    // Check SKU conflict if updating
    if (updateProductDto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          organizationId,
          sku: updateProductDto.sku,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    // Check barcode conflict if updating
    if (updateProductDto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          organizationId,
          barcode: updateProductDto.barcode,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Product barcode already exists');
      }
    }

    // Verify category exists if updating
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateProductDto.categoryId,
          organizationId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: {
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
    // Verify product exists
    await this.findOne(id, organizationId);

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    await this.findOne(id, organizationId);

    return this.prisma.product.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
      },
    });
  }

  async getLowStock(organizationId: string, branchId?: string) {
    const where: any = {
      organizationId,
      deletedAt: null,
      trackInventory: true,
      branchInventory: {
        some: {
          quantity: {
            lte: this.prisma.product.fields.reorderLevel,
          },
        },
      },
    };

    if (branchId) {
      where.branchInventory.some.branchId = branchId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        branchInventory: {
          where: branchId ? { branchId } : {},
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async searchByBarcode(organizationId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        organizationId,
        barcode,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        branchInventory: {
          select: {
            branchId: true,
            quantity: true,
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
