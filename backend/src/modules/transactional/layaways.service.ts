import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LayawaysService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.layaway.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.layaway.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    const count = await this.prisma.layaway.count({ where: { organizationId } });
    const layawayNumber = `LAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

    // Gap 4 — L1: Hard-reserve stock in cloud on layaway creation
    const items: Array<{ productId: string; quantity: number; branchId?: string }> = dto.items || [];
    const branchId: string | undefined = dto.branchId;

    if (branchId && items.length > 0) {
      for (const item of items) {
        const inv = await this.prisma.branchInventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId } },
        });

        if (!inv || Number(inv.quantity) - Number(inv.reservedQuantity) < item.quantity) {
          throw new ConflictException({
            code: 'CONFLICT_STOCK',
            message: `Insufficient available stock for product ${item.productId}. Item may have been sold on another device.`,
            productId: item.productId,
          });
        }

        await this.prisma.branchInventory.update({
          where: { productId_branchId: { productId: item.productId, branchId } },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }
    }

    return this.prisma.layaway.create({
      data: { ...dto, organizationId, layawayNumber, status: 'active' },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.layaway.update({ where: { id }, data: dto });
  }
}
