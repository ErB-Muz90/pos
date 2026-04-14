import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.salesOrder.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    const count = await this.prisma.salesOrder.count({ where: { organizationId } });
    const soNumber = `SO-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    return this.prisma.salesOrder.create({ data: { ...dto, organizationId, soNumber } });
  }

  async update(id: string, dto: any, organizationId: string) {
    return this.prisma.salesOrder.update({ where: { id, organizationId }, data: dto });
  }
}
