import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.purchaseOrder.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    const count = await this.prisma.purchaseOrder.count({ where: { organizationId } });
    const poNumber = `PO-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    return this.prisma.purchaseOrder.create({ data: { ...dto, organizationId, poNumber } });
  }

  async update(id: string, dto: any, organizationId: string) {
    return this.prisma.purchaseOrder.update({ where: { id, organizationId }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.purchaseOrder.delete({ where: { id, organizationId } });
  }

  async receive(id: string, organizationId: string, items: Array<{ productId: string; quantity: number; unitCost?: number }>) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id, organizationId } });
    if (!po) throw new Error('Purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'received', receivedDate: new Date(), items: items as any },
    });
  }
}
