import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AdjustInventoryDto,
  TransferInventoryDto,
  ReceiveStockDto,
} from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get inventory for a branch
   */
  async getBranchInventory(
    organizationId: string,
    branchId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    lowStock?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      branchId,
      branch: { organizationId },
      product: { deletedAt: null },
    };

    if (search) {
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (lowStock) {
      // TODO: Implement low stock filter properly
      // where.quantity = { lte: reorderLevel };
    }

    const [inventory, total] = await Promise.all([
      this.prisma.branchInventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              sellingPrice: true,
              costPrice: true,
              reorderLevel: true,
              reorderQuantity: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
        skip,
        take: limit,
        orderBy: { product: { name: 'asc' } },
      }),
      this.prisma.branchInventory.count({ where }),
    ]);

    return {
      data: inventory,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get inventory for a specific product across all branches
   */
  async getProductInventory(organizationId: string, productId: string) {
    // Verify product exists
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const inventory = await this.prisma.branchInventory.findMany({
      where: {
        productId,
        branch: { organizationId },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { branch: { name: 'asc' } },
    });

    const totalQuantity = inventory.reduce(
      (sum, inv) => sum + Number(inv.quantity),
      0,
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        reorderLevel: product.reorderLevel,
      },
      totalQuantity,
      branches: inventory,
    };
  }

  /**
   * Adjust inventory (increase or decrease)
   */
  async adjustInventory(
    organizationId: string,
    userId: string,
    adjustDto: AdjustInventoryDto,
  ) {
    // Verify product and branch
    await this.verifyProductAndBranch(
      organizationId,
      adjustDto.productId,
      adjustDto.branchId,
    );

    return this.prisma.$transaction(async (tx) => {
      // Get or create inventory record
      let inventory = await tx.branchInventory.findUnique({
        where: {
          productId_branchId: {
            branchId: adjustDto.branchId,
            productId: adjustDto.productId,
          },
        },
      });

      const oldQuantity = Number(inventory?.quantity || 0);
      const newQuantity = oldQuantity + adjustDto.quantity;

      if (newQuantity < 0) {
        throw new BadRequestException('Insufficient inventory');
      }

      if (inventory) {
        inventory = await tx.branchInventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            lastCountedAt: new Date(),
          },
        });
      } else {
        inventory = await tx.branchInventory.create({
          data: {
            branchId: adjustDto.branchId,
            productId: adjustDto.productId,
            quantity: newQuantity,
            lastCountedAt: new Date(),
          },
        });
      }

      // Create movement record
      await tx.inventoryMovement.create({
        data: {
          branchId: adjustDto.branchId,
          productId: adjustDto.productId,
          type: adjustDto.type,
          quantity: adjustDto.quantity,
          quantityBefore: oldQuantity,
          quantityAfter: newQuantity,
          userId,
          reason: adjustDto.reason,
          referenceNumber: adjustDto.referenceNumber,
        },
      });

      this.logger.log(
        `Inventory adjusted: Product ${adjustDto.productId}, Branch ${adjustDto.branchId}, Qty ${adjustDto.quantity}`,
      );

      return inventory;
    });
  }

  /**
   * Transfer inventory between branches
   */
  async transferInventory(
    organizationId: string,
    userId: string,
    transferDto: TransferInventoryDto,
  ) {
    if (transferDto.fromBranchId === transferDto.toBranchId) {
      throw new BadRequestException('Cannot transfer to the same branch');
    }

    // Verify product and branches
    await this.verifyProductAndBranch(
      organizationId,
      transferDto.productId,
      transferDto.fromBranchId,
    );
    await this.verifyProductAndBranch(
      organizationId,
      transferDto.productId,
      transferDto.toBranchId,
    );

    return this.prisma.$transaction(async (tx) => {
      // Check source inventory
      const sourceInventory = await tx.branchInventory.findUnique({
        where: {
          productId_branchId: {
            branchId: transferDto.fromBranchId,
            productId: transferDto.productId,
          },
        },
      });

      if (
        !sourceInventory ||
        Number(sourceInventory.quantity) < transferDto.quantity
      ) {
        throw new BadRequestException('Insufficient inventory at source branch');
      }

      // Decrease source
      const newSourceQty = Number(sourceInventory.quantity) - transferDto.quantity;
      await tx.branchInventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: newSourceQty },
      });

      // Increase destination
      const destInventory = await tx.branchInventory.findUnique({
        where: {
          productId_branchId: {
            branchId: transferDto.toBranchId,
            productId: transferDto.productId,
          },
        },
      });

      if (destInventory) {
        await tx.branchInventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: Number(destInventory.quantity) + transferDto.quantity,
          },
        });
      } else {
        await tx.branchInventory.create({
          data: {
            branchId: transferDto.toBranchId,
            productId: transferDto.productId,
            quantity: transferDto.quantity,
          },
        });
      }

      // Create movement records for transfer
      const referenceNumber = `TRF-${Date.now()}`;
      await tx.inventoryMovement.createMany({
        data: [
          {
            branchId: transferDto.fromBranchId,
            productId: transferDto.productId,
            type: 'transfer_out',
            quantity: -transferDto.quantity,
            quantityBefore: Number(sourceInventory.quantity),
            quantityAfter: newSourceQty,
            userId,
            reason: transferDto.notes,
            referenceNumber,
          },
          {
            branchId: transferDto.toBranchId,
            productId: transferDto.productId,
            type: 'transfer_in',
            quantity: transferDto.quantity,
            quantityBefore: Number(destInventory?.quantity || 0),
            quantityAfter: Number(destInventory?.quantity || 0) + transferDto.quantity,
            userId,
            reason: transferDto.notes,
            referenceNumber,
          },
        ],
      });

      this.logger.log(
        `Inventory transferred: Product ${transferDto.productId}, From ${transferDto.fromBranchId} to ${transferDto.toBranchId}, Qty ${transferDto.quantity}`,
      );

      return { referenceNumber, success: true };
    });
  }

  /**
   * Receive stock (purchase/restock)
   */
  async receiveStock(
    organizationId: string,
    userId: string,
    receiveDto: ReceiveStockDto,
  ) {
    // Verify product and branch
    await this.verifyProductAndBranch(
      organizationId,
      receiveDto.productId,
      receiveDto.branchId,
    );

    return this.prisma.$transaction(async (tx) => {
      // Get or create inventory
      let inventory = await tx.branchInventory.findUnique({
        where: {
          productId_branchId: {
            branchId: receiveDto.branchId,
            productId: receiveDto.productId,
          },
        },
      });

      const oldQuantity = Number(inventory?.quantity || 0);
      const newQuantity = oldQuantity + receiveDto.quantity;

      if (inventory) {
        inventory = await tx.branchInventory.update({
          where: { id: inventory.id },
          data: { quantity: newQuantity },
        });
      } else {
        inventory = await tx.branchInventory.create({
          data: {
            branchId: receiveDto.branchId,
            productId: receiveDto.productId,
            quantity: newQuantity,
          },
        });
      }

      // Create movement record
      await tx.inventoryMovement.create({
        data: {
          branchId: receiveDto.branchId,
          productId: receiveDto.productId,
          type: 'purchase',
          quantity: receiveDto.quantity,
          quantityBefore: oldQuantity,
          quantityAfter: newQuantity,
          unitCost: receiveDto.unitCost,
          userId,
          referenceNumber: receiveDto.purchaseOrderNumber,
          metadata: receiveDto.supplierReference
            ? { supplierReference: receiveDto.supplierReference }
            : undefined,
        },
      });

      this.logger.log(
        `Stock received: Product ${receiveDto.productId}, Branch ${receiveDto.branchId}, Qty ${receiveDto.quantity}`,
      );

      return inventory;
    });
  }

  /**
   * Get inventory movements (history)
   */
  async getMovements(
    organizationId: string,
    branchId?: string,
    productId?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      branch: { organizationId },
    };
    if (branchId) where.branchId = branchId;
    if (productId) where.productId = productId;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Verify product and branch exist and belong to organization
   */
  private async verifyProductAndBranch(
    organizationId: string,
    productId: string,
    branchId: string,
  ) {
    const [product, branch] = await Promise.all([
      this.prisma.product.findFirst({
        where: {
          id: productId,
          organizationId,
          deletedAt: null,
        },
      }),
      this.prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }
}
