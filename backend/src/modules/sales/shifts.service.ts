import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

const VARIANCE_TOLERANCE_KES = 5;

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  /**
   * Open a new shift — seeds float into ledger, returns serverTime for clock drift (S5)
   */
  async openShift(
    branchId: string,
    openingCash: number,
    userId: string,
    organizationId: string,
    username: string,
  ) {
    const existingShift = await this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
    });
    if (existingShift) throw new BadRequestException('You already have an open shift');

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayShiftCount = await this.prisma.shift.count({
      where: { branchId, startedAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
    });
    const shiftNumber = `SH-${dateStr}-${username.toUpperCase()}-${(todayShiftCount + 1).toString().padStart(3, '0')}`;

    const serverTime = new Date();

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

    // Seed float into ledger (Law F2 — append-only)
    await this.ledger.createEntry({
      organizationId,
      branchId,
      shiftId: shift.id,
      type: 'FLOAT',
      amount: openingCash,
      description: `Opening float for shift ${shiftNumber}`,
      createdBy: userId,
    });

    return { ...shift, serverTime: serverTime.toISOString() };
  }

  /**
   * Close a shift with full reconciliation (S4):
   * 1. Compute expected close from cloud ledger
   * 2. Compare with cashier's physical count
   * 3. Variance ≤ KES 5 → auto-accept | > KES 5 → require manager sign-off
   * 4. Lock shift after close
   */
  async closeShift(
    shiftId: string,
    closingCash: number,
    notes: string,
    userId: string,
    userRole: string,
    organizationId: string,
    managerOverride?: { managerId: string; reason: string },
  ) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new BadRequestException('Shift not found');
    if (shift.organizationId !== organizationId) throw new ForbiddenException('Shift does not belong to your organization');
    if (shift.status !== 'open') throw new BadRequestException('Shift is already closed');
    if (shift.organizationId !== userId && shift.userId !== userId && !['admin', 'manager'].includes(userRole)) {
      throw new ForbiddenException('You can only close your own shift');
    }

    // Compute expected cash from canonical ledger
    const ledgerBalance = await this.ledger.computeCashBalance(
      shift.organizationId,
      { shiftId },
    );

    const variance = closingCash - ledgerBalance;
    const absVariance = Math.abs(variance);

    // S4: Variance > KES 5 requires manager sign-off
    if (absVariance > VARIANCE_TOLERANCE_KES && !managerOverride) {
      throw new BadRequestException({
        code: 'SHIFT_VARIANCE_REQUIRES_APPROVAL',
        message: `Cash variance of KES ${absVariance.toFixed(2)} exceeds tolerance. Manager sign-off required.`,
        expectedCash: ledgerBalance,
        actualCash: closingCash,
        variance,
      });
    }

    const closedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closingCash,
        expectedCash: ledgerBalance,
        cashDifference: variance,
        endedAt: new Date(),
        status: 'closed',
        notes: managerOverride
          ? `${notes} | Manager override by ${managerOverride.managerId}: ${managerOverride.reason}`
          : notes,
      },
    });

    return {
      ...closedShift,
      reconciliation: {
        expectedCash: ledgerBalance,
        actualCash: closingCash,
        variance,
        autoAccepted: absVariance <= VARIANCE_TOLERANCE_KES,
        managerOverride: managerOverride ?? null,
      },
    };
  }

  async getShiftSummary(shiftId: string, organizationId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organizationId },
      include: {
        user: { select: { fullName: true, username: true } },
        branch: { select: { name: true } },
      },
    });
    if (!shift) throw new BadRequestException('Shift not found');

    const ledgerSummary = await this.ledger.getShiftSummary(shiftId, organizationId);

    const paymentBreakdown: any = await this.prisma.$queryRaw`
      SELECT p."paymentMethod", SUM(p.amount)::numeric as total, COUNT(p.id)::integer as count
      FROM "Payment" p
      INNER JOIN "Sale" s ON s.id = p."saleId"
      WHERE s."shiftId" = ${shiftId} AND s.status = 'completed'
      GROUP BY p."paymentMethod"
    `;

    return {
      shift,
      ledgerSummary,
      paymentBreakdown: paymentBreakdown.map((pb: any) => ({
        method: pb.paymentMethod,
        amount: Number(pb.total) || 0,
        count: pb.count,
      })),
    };
  }

  async getCurrentShift(userId: string) {
    return this.prisma.shift.findFirst({
      where: { userId, status: 'open' },
      include: { branch: { select: { name: true } } },
    });
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 20,
    branchId?: string,
    userId?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { organizationId };
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: {
          user: { select: { fullName: true, username: true } },
          branch: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return { data: shifts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
