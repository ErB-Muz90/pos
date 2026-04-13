import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export type LedgerEntryType =
  | 'SALE'
  | 'SALE_RETURN'
  | 'LAYAWAY_DEPOSIT'
  | 'LAYAWAY_INSTALLMENT'
  | 'EXPENSE'
  | 'COGS'
  | 'FLOAT'
  | 'AP_PAYMENT';

export interface CreateLedgerEntryDto {
  organizationId: string;
  branchId?: string;
  shiftId?: string;
  saleId?: string;
  referenceId?: string;
  type: LedgerEntryType;
  /** Positive = cash in, negative = cash out */
  amount: number;
  description?: string;
  createdBy?: string;
  deviceCreatedAt?: Date;
}

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /** Append-only write — never updates or deletes (Law F2) */
  async createEntry(
    dto: CreateLedgerEntryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.transactionLedger.create({ data: dto });
  }

  /** Compute cash balance from canonical ledger for a given scope */
  async computeCashBalance(
    organizationId: string,
    opts: { shiftId?: string; branchId?: string } = {},
  ): Promise<number> {
    const where: any = { organizationId };
    if (opts.shiftId) where.shiftId = opts.shiftId;
    if (opts.branchId) where.branchId = opts.branchId;

    const result = await this.prisma.transactionLedger.aggregate({
      where,
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  /** Shift summary: breakdown by type for reconciliation (S4) */
  async getShiftSummary(shiftId: string, organizationId: string) {
    const entries = await this.prisma.transactionLedger.findMany({
      where: { shiftId, organizationId },
      orderBy: { createdAt: 'asc' },
    });

    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const e of entries) {
      const amt = Number(e.amount);
      breakdown[e.type] = (breakdown[e.type] ?? 0) + amt;
      total += amt;
    }

    return { shiftId, total, breakdown, entryCount: entries.length };
  }
}
