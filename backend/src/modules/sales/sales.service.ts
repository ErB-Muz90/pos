import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSaleDto, VoidSaleDto } from './dto/create-sale.dto';
import { Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  /**
   * Check if sale with this idempotency key already exists
   * Prevents duplicate submissions
   */
  private async checkIdempotency(idempotencyKey?: string) {
    if (!idempotencyKey) {
      return null;
    }

    const existingSale = await this.prisma.sale.findFirst({
      where: { idempotencyKey },
      include: {
        saleItems: true,
        payments: true,
      },
    });

    return existingSale;
  }

  /**
   * Validate that all products have sufficient stock
   */
  private async validateStockAvailability(
    items: CreateSaleDto['items'],
    branchId: string,
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);

    const inventory = await this.prisma.branchInventory.findMany({
      where: {
        branchId,
        productId: { in: productIds },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    }) as Array<{
      productId: string;
      quantity: any;
      product: {
        name: string;
        sku: string;
      };
    }>;

    const inventoryMap = new Map(inventory.map((inv) => [inv.productId, inv]));

    const insufficientItems = [];

    for (const item of items) {
      const inv = inventoryMap.get(item.productId);

      if (!inv) {
        insufficientItems.push({
          productId: item.productId,
          productName: 'Unknown Product',
          requested: item.quantity,
          available: 0,
          message: 'Product not found in branch inventory',
        });
        continue;
      }

      if (Number(inv.quantity) < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          productName: inv.product.name,
          sku: inv.product.sku,
          requested: item.quantity,
          available: Number(inv.quantity),
          message: `Insufficient stock. Requested: ${item.quantity}, Available: ${inv.quantity}`,
        });
      }
    }

    if (insufficientItems.length > 0) {
      throw new ConflictException({
        message: 'Insufficient stock for one or more products',
        insufficientItems,
      });
    }
  }

  /**
   * Generate unique sale number
   * Format: SALE-YYYYMMDD-BRANCH-SEQUENCE
   */
  private async generateSaleNumber(
    branchId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await tx.sale.count({
      where: {
        branchId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequence = (todayCount + 1).toString().padStart(6, '0');

    return `SALE-${dateStr}-${branch.code}-${sequence}`;
  }

  /**
   * Calculate sale totals from items
   */
  private calculateSaleTotals(
    items: CreateSaleDto['items'],
    discountAmount: number = 0,
  ) {
    let subtotal = 0;
    let totalTax = 0;

    const processedItems = items.map((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscountAmount = item.discount || 0;
      const itemDiscountedSubtotal = itemSubtotal - itemDiscountAmount;
      const taxRate = item.taxRate || 16;
      const itemTaxAmount = (itemDiscountedSubtotal * taxRate) / 100;
      const itemTotal = itemDiscountedSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      totalTax += itemTaxAmount;

      return {
        ...item,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        totalAmount: itemTotal,
        discountAmount: itemDiscountAmount,
      };
    });

    const subtotalAfterItemDiscounts =
      subtotal -
      items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const finalSubtotal = subtotalAfterItemDiscounts - discountAmount;

    if (discountAmount > 0) {
      totalTax = (finalSubtotal * 16) / 100;
    }

    const totalAmount = finalSubtotal + totalTax;

    return {
      items: processedItems,
      subtotal,
      discountAmount,
      taxAmount: totalTax,
      totalAmount,
    };
  }

  /**
   * Update inventory atomically
   */
  private async updateInventory(
    tx: Prisma.TransactionClient,
    items: Array<{
      productId: string;
      quantity: number;
      costPrice: number;
      productName: string;
    }>,
    branchId: string,
    saleId: string,
    userId: string,
  ): Promise<void> {
    for (const item of items) {
      const currentInventory = await tx.branchInventory.findUnique({
        where: {
          productId_branchId: {
            productId: item.productId,
            branchId,
          },
        },
        select: {
          quantity: true,
        },
      });

      if (!currentInventory) {
        throw new BadRequestException(
          `Inventory not found for product ${item.productName}`,
        );
      }

      const quantityBefore = Number(currentInventory.quantity);
      const quantityAfter = quantityBefore - item.quantity;

      if (quantityAfter < 0) {
        throw new ConflictException(
          `Insufficient stock for ${item.productName}`,
        );
      }

      await tx.branchInventory.update({
        where: {
          productId_branchId: {
            productId: item.productId,
            branchId,
          },
        },
        data: {
          quantity: quantityAfter,
          lastCountedAt: new Date(),
        },
      });

      // TODO: Add InventoryMovement model to schema for audit trail
      // await tx.inventoryMovement.create({
      //   data: {
      //     branchId,
      //     productId: item.productId,
      //     type: 'sale',
      //     quantity: -item.quantity,
      //     quantityBefore,
      //     quantityAfter,
      //     unitCost: item.costPrice,
      //     userId,
      //     referenceNumber: saleId,
      //     reason: 'Sale transaction',
      //   },
      // });
    }
  }

  // S5: Max allowed clock skew — 24 hours in ms
  private readonly MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

  private checkClockSkew(clientCreatedAt?: string | Date): void {
    if (!clientCreatedAt) return;
    const delta = Math.abs(Date.now() - new Date(clientCreatedAt).getTime());
    if (delta > this.MAX_CLOCK_SKEW_MS) {
      throw new BadRequestException({
        code: 'CLOCK_SKEW',
        message: 'Device clock is more than 24h from server time. Event quarantined.',
        serverTime: new Date().toISOString(),
        clientCreatedAt,
      });
    }
  }

  /**
   * Complete a sale transaction with ACID compliance
   */
  async completeSale(
    dto: CreateSaleDto,
    userId: string,
    organizationId: string,
    idempotencyKey?: string,
  ) {
    // S5: Clock skew guard
    this.checkClockSkew((dto as any).clientCreatedAt);
    // 1. Check idempotency
    const existingSale = await this.checkIdempotency(idempotencyKey);
    if (existingSale) {
      this.logger.log(`Returning existing sale for idempotency key: ${idempotencyKey}`);
      return existingSale;
    }

    // 2. Validate stock availability
    await this.validateStockAvailability(dto.items, dto.branchId);

    // 3. Calculate totals
    const { items: calculatedItems, subtotal, taxAmount, totalAmount } =
      this.calculateSaleTotals(dto.items, dto.discount);

    // 4. Start database transaction
    const sale = await this.prisma.$transaction(
      async (tx) => {
        // 4a. Generate sale number
        const saleNumber = await this.generateSaleNumber(dto.branchId, tx);

        // 4b. Create sale record
        const createdSale = await tx.sale.create({
          data: {
            saleNumber,
            receiptNumber: saleNumber,
            saleDate: new Date(),
            subtotal,
            discountAmount: dto.discount || 0,
            taxAmount,
            totalAmount,
            amountPaid: totalAmount,
            changeAmount: 0,
            status: 'completed',
            idempotencyKey,
            notes: dto.notes,
            organization: { connect: { id: organizationId } },
            branch: { connect: { id: dto.branchId } },
            user: { connect: { id: userId } },
            ...(dto.shiftId && { shift: { connect: { id: dto.shiftId } } }),
            ...(dto.customerId && { customer: { connect: { id: dto.customerId } } }),
          },
        });

        // 4c. Create sale items
        const saleItems = await Promise.all(
          calculatedItems.map(async (item) => {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: {
                name: true,
                sku: true,
                costPrice: true,
              },
            });

            if (!product) {
              throw new BadRequestException(`Product ${item.productId} not found`);
            }

            return tx.saleItem.create({
              data: {
                saleId: createdSale.id,
                productId: item.productId,
                productName: product.name,
                productSku: product.sku || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount || 0,
                taxRate: item.taxRate || 16,
                taxAmount: item.taxAmount,
                subtotal: item.subtotal,
                totalAmount: item.totalAmount,
                costPrice: product.costPrice,
              },
            });
          }),
        );

        // 4d. Update inventory
        await this.updateInventory(
          tx,
          saleItems.map((si) => ({
            productId: si.productId,
            quantity: Number(si.quantity),
            costPrice: 0,
            productName: si.productId,
          })),
          dto.branchId,
          createdSale.id,
          userId,
        );

        // 4e. Create payment record
        // Gap 2 — F4: M-Pesa duplicate ref check
        const mpesaRef = (dto as any).mpesaRef as string | undefined;
        if (dto.paymentMethod === 'mpesa' && mpesaRef) {
          const dupPayment = await tx.payment.findFirst({
            where: { transactionReference: mpesaRef, paymentMethod: 'mpesa' },
          });
          if (dupPayment) {
            throw new ConflictException({
              code: 'MPESA_DUPLICATE_REF',
              message: `M-Pesa ref ${mpesaRef} already exists. Flagged for manager review.`,
              existingSaleId: dupPayment.saleId,
              mpesaRef,
            });
          }
        }

        await tx.payment.create({
          data: {
            saleId: createdSale.id,
            paymentMethod: dto.paymentMethod || 'cash',
            amount: totalAmount,
            transactionReference: mpesaRef,
            paymentDate: new Date(),
            status: 'completed',
          },
        });

        // 4f. Update shift totals (if shift provided)
        if (dto.shiftId) {
          await tx.shift.update({
            where: { id: dto.shiftId },
            data: {
              totalSales: { increment: totalAmount },
              totalTransactions: { increment: 1 },
            },
          });
        }

        // 4g. Update customer loyalty points (if customer provided)
        if (dto.customerId) {
          const loyaltyPoints = Math.floor(totalAmount / 100);
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { loyaltyPoints: { increment: loyaltyPoints } },
          });
        }

        // Step 5 — Atomic ledger writes (Law F2: append-only)
        // SALE entry: cash in
        await this.ledger.createEntry({
          organizationId,
          branchId: dto.branchId,
          shiftId: dto.shiftId,
          saleId: createdSale.id,
          type: 'SALE',
          amount: totalAmount,
          description: `Sale ${saleNumber}`,
          createdBy: userId,
          deviceCreatedAt: (dto as any).clientCreatedAt
            ? new Date((dto as any).clientCreatedAt)
            : undefined,
        }, tx);

        // COGS entry: cost of goods sold (cash out)
        const totalCogs = saleItems.reduce(
          (sum, si) => sum + Number(si.costPrice ?? 0) * Number(si.quantity),
          0,
        );
        if (totalCogs > 0) {
          await this.ledger.createEntry({
            organizationId,
            branchId: dto.branchId,
            shiftId: dto.shiftId,
            saleId: createdSale.id,
            type: 'COGS',
            amount: -totalCogs,
            description: `COGS for sale ${saleNumber}`,
            createdBy: userId,
          }, tx);
        }

        return createdSale;
      },
      {
        timeout: 30000,
        isolationLevel: 'Serializable' as any,
      },
    );

    this.logger.log(`Sale completed: ${sale.receiptNumber}`);

    // Return with relations
    return this.prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        saleItems: true,
        customer: true,
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Void a sale and restore inventory
   */
  async voidSale(
    saleId: string,
    voidDto: VoidSaleDto,
    userId: string,
    userRole: string,
  ) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Sale not found');
    }

    if (sale.status === 'void') {
      throw new BadRequestException('Sale already voided');
    }

    // Check if sale is from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const saleDate = new Date(sale.createdAt);
    saleDate.setHours(0, 0, 0, 0);

    if (saleDate < today) {
      throw new BadRequestException('Cannot void sales from previous days');
    }

    // Check permissions
    if (!['manager', 'admin'].includes(userRole)) {
      throw new BadRequestException('Insufficient permissions to void sales');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update sale status
      const voidedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'void',
          notes: `VOIDED: ${voidDto.reason}`,
        },
      });

      // 2. Restore inventory
      for (const item of sale.saleItems) {
        const currentInventory = await tx.branchInventory.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: sale.branchId,
            },
          },
        });

        if (currentInventory) {
          const quantityBefore = Number(currentInventory.quantity);
          const quantityAfter = quantityBefore + Number(item.quantity);

          await tx.branchInventory.update({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId: sale.branchId,
              },
            },
            data: {
              quantity: quantityAfter,
            },
          });

          // TODO: Add InventoryMovement model to schema for audit trail
          // await tx.inventoryMovement.create({
          //   data: {
          //     branchId: sale.branchId,
          //     productId: item.productId,
          //     type: 'adjustment',
          //     quantity: Number(item.quantity),
          //     quantityBefore,
          //     quantityAfter,
          //     userId,
          //     referenceNumber: saleId,
          //     reason: `Voided sale: ${voidDto.reason}`,
          //   },
          // });
        }
      }

      // 3. Update shift totals
      if (sale.shiftId) {
        await tx.shift.update({
          where: { id: sale.shiftId },
          data: {
            totalSales: { decrement: Number(sale.totalAmount) },
            totalTransactions: { decrement: 1 },
          },
        });
      }

      // 4. Reverse customer loyalty points
      if (sale.customerId) {
        const loyaltyPoints = Math.floor(Number(sale.totalAmount) / 100);
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            loyaltyPoints: { decrement: loyaltyPoints },
          },
        });
      }

      return voidedSale;
    });
  }

  /**
   * Get sale by ID
   */
  async findOne(id: string, organizationId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                barcode: true,
              },
            },
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
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

    if (!sale) {
      throw new BadRequestException('Sale not found');
    }

    return sale;
  }

  /**
   * Get sales list with pagination and filters
   */
  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    branchId?: string,
    customerId?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (branchId) where.branchId = branchId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          saleItems: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          user: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
