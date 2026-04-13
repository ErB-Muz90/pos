import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Open a new shift — returns serverTime so device can compute clockDrift
   */
  async openShift(
    branchId: string,
    openingCash: number,
    userId: string,
    organizationId: string,
    username: string,
  ) {
    // Check if user has an open shift
    const existingShift = await this.prisma.shift.findFirst({
      where: {
        userId,
        status: 'open',
      },
    });

    if (existingShift) {
      throw new BadRequestException('You already have an open shift');
    }

    // Generate shift number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const todayShiftCount = await this.prisma.shift.count({
      where: {
        branchId,
        startedAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    const shiftNumber = `SH-${dateStr}-${username.toUpperCase()}-${(todayShiftCount + 1).toString().padStart(3, '0')}`;

    const serverTime = new Date();

    // Create shift
    const shift = await this.prisma.shift.create({
      data: {
        organizationId,
        branchId,
        userId,
        shiftNumber,
        openingCash,
        startedAt: serverTime,
        status: 'open',
        totalSales: 0,
        totalTransactions: 0,
      },
    });

    return { ...shift, serverTime: serverTime.toISOString() };
  }

  /**
   * Close a shift with cash reconciliation
   */
  async closeShift(
    shiftId: string,
    closingCash: number,
    notes: string,
    userId: string,
    userRole: string,
  ) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new BadRequestException('Shift not found');
    }

    if (shift.status !== 'open') {
      throw new BadRequestException('Shift is already closed');
    }

    if (shift.userId !== userId && userRole !== 'admin') {
      throw new BadRequestException('You can only close your own shift');
    }

    // Calculate expected cash (opening + cash sales)
    const cashPayments: any = await this.prisma.$queryRaw`
      SELECT SUM(p.amount)::numeric as total
      FROM "Payment" p
      INNER JOIN "Sale" s ON s.id = p."saleId"
      WHERE s."shiftId" = ${shiftId}
        AND s.status = 'completed'
        AND p."paymentMethod" = 'cash'
    `;

    const expectedCash = Number(shift.openingCash) + Number(cashPayments[0]?.total || 0);
    const cashDifference = closingCash - expectedCash;

    // Close shift
    return await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closingCash,
        expectedCash,
        cashDifference,
        endedAt: new Date(),
        status: 'closed',
        notes,
      },
    });
  }

  /**
   * Get shift summary
   */
  async getShiftSummary(shiftId: string, organizationId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        organizationId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!shift) {
      throw new BadRequestException('Shift not found');
    }

    // Get payment breakdown using raw query to avoid Prisma groupBy typing issues
    const paymentBreakdown: any = await this.prisma.$queryRaw`
      SELECT 
        p."paymentMethod",
        SUM(p.amount)::numeric as "_sum_totalAmount",
        COUNT(p.id)::integer as "_count_id"
      FROM "Payment" p
      INNER JOIN "Sale" s ON s.id = p."saleId"
      WHERE s."shiftId" = ${shiftId}
        AND s.status = 'completed'
      GROUP BY p."paymentMethod"
    `;

    // Get sales details
    const sales = await this.prisma.sale.findMany({
      where: { shiftId },
      select: {
        id: true,
        receiptNumber: true,
        totalAmount: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      shift,
      paymentBreakdown: paymentBreakdown.map((pb: any) => ({
        method: pb.paymentMethod,
        amount: Number(pb._sum_totalAmount) || 0,
        count: pb._count_id,
      })),
      sales,
    };
  }

  /**
   * Get user's current open shift
   */
  async getCurrentShift(userId: string) {
    return await this.prisma.shift.findFirst({
      where: {
        userId,
        status: 'open',
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get all shifts with pagination
   */
  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    branchId?: string,
    userId?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              username: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      data: shifts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
