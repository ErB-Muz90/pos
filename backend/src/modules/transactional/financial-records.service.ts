import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinancialRecordsService {
  constructor(private prisma: PrismaService) {}

  // ── Supplier Payments ────────────────────────────────────────────────────
  async getSupplierPayments(orgId: string) {
    return (this.prisma as any).supplierPayment.findMany({ where: { organizationId: orgId }, orderBy: { paymentDate: 'desc' } });
  }
  async createSupplierPayment(orgId: string, dto: any) {
    return (this.prisma as any).supplierPayment.create({ data: { ...dto, organizationId: orgId } });
  }
  async updateSupplierPayment(id: string, orgId: string, dto: any) {
    return (this.prisma as any).supplierPayment.update({ where: { id, organizationId: orgId }, data: dto });
  }
  async deleteSupplierPayment(id: string, orgId: string) {
    return (this.prisma as any).supplierPayment.delete({ where: { id, organizationId: orgId } });
  }

  // ── Bank Deposits ────────────────────────────────────────────────────────
  async getBankDeposits(orgId: string) {
    return (this.prisma as any).bankDeposit.findMany({ where: { organizationId: orgId }, orderBy: { depositDate: 'desc' } });
  }
  async createBankDeposit(orgId: string, dto: any) {
    return (this.prisma as any).bankDeposit.create({ data: { ...dto, organizationId: orgId } });
  }
  async updateBankDeposit(id: string, orgId: string, dto: any) {
    return (this.prisma as any).bankDeposit.update({ where: { id, organizationId: orgId }, data: dto });
  }

  // ── Bank Withdrawals ─────────────────────────────────────────────────────
  async getBankWithdrawals(orgId: string) {
    return (this.prisma as any).bankWithdrawal.findMany({ where: { organizationId: orgId }, orderBy: { withdrawalDate: 'desc' } });
  }
  async createBankWithdrawal(orgId: string, dto: any) {
    return (this.prisma as any).bankWithdrawal.create({ data: { ...dto, organizationId: orgId } });
  }
  async updateBankWithdrawal(id: string, orgId: string, dto: any) {
    return (this.prisma as any).bankWithdrawal.update({ where: { id, organizationId: orgId }, data: dto });
  }

  // ── Stock Movements ──────────────────────────────────────────────────────
  async getStockMovements(orgId: string) {
    return (this.prisma as any).stockMovement.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }
  async createStockMovement(orgId: string, dto: any) {
    return (this.prisma as any).stockMovement.create({ data: { ...dto, organizationId: orgId } });
  }

  // ── Work Order Materials ─────────────────────────────────────────────────
  async getWorkOrderMaterials(orgId: string, workOrderId?: string) {
    const where: any = { organizationId: orgId };
    if (workOrderId) where.workOrderId = workOrderId;
    return (this.prisma as any).workOrderMaterial.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async createWorkOrderMaterial(orgId: string, dto: any) {
    return (this.prisma as any).workOrderMaterial.create({ data: { ...dto, organizationId: orgId } });
  }
  async updateWorkOrderMaterial(id: string, orgId: string, dto: any) {
    return (this.prisma as any).workOrderMaterial.update({ where: { id, organizationId: orgId }, data: dto });
  }
  async deleteWorkOrderMaterial(id: string, orgId: string) {
    return (this.prisma as any).workOrderMaterial.delete({ where: { id, organizationId: orgId } });
  }

  // ── Chart of Accounts ────────────────────────────────────────────────────
  async getAccounts(orgId: string) {
    return (this.prisma as any).account.findMany({
      where: { OR: [{ organizationId: orgId }, { organizationId: null }] },
      orderBy: { code: 'asc' },
    });
  }
  async upsertAccount(orgId: string, dto: any) {
    const { id, ...data } = dto;
    return (this.prisma as any).account.upsert({
      where: { id: id || `acc_${Date.now()}` },
      create: { id: id || `acc_${Date.now()}`, ...data, organizationId: orgId },
      update: data,
    });
  }

  // ── Accounting Transactions ──────────────────────────────────────────────
  async getAccountingTransactions(orgId: string) {
    return (this.prisma as any).accountingTransaction.findMany({ where: { organizationId: orgId }, orderBy: { date: 'desc' } });
  }
  async createAccountingTransaction(orgId: string, dto: any) {
    return (this.prisma as any).accountingTransaction.create({ data: { ...dto, organizationId: orgId } });
  }
}
