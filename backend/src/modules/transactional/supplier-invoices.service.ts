import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupplierInvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supplierInvoice.findMany({ where: { organizationId }, orderBy: { invoiceDate: 'desc' }, skip, take: limit }),
      this.prisma.supplierInvoice.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    return this.prisma.supplierInvoice.create({ data: { ...dto, organizationId } });
  }

  async update(id: string, dto: any, organizationId: string) {
    return this.prisma.supplierInvoice.update({ where: { id, organizationId }, data: dto });
  }

  async recordPayment(id: string, payment: any, organizationId: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({ where: { id, organizationId } });
    if (!invoice) throw new Error('Invoice not found');
    const payments = [...(invoice.payments as any[]), { ...payment, id: `pay_${Date.now()}` }];
    const amountPaid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const status = amountPaid >= Number(invoice.totalAmount) ? 'paid' : 'partial';
    return this.prisma.supplierInvoice.update({ where: { id }, data: { payments, amountPaid, status } });
  }
}
