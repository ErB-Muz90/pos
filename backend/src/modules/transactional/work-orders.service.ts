import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.workOrder.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    const count = await this.prisma.workOrder.count({ where: { organizationId } });
    const woNumber = `WO-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    return this.prisma.workOrder.create({ data: { ...dto, organizationId, woNumber } });
  }

  async update(id: string, dto: any) {
    return this.prisma.workOrder.update({ where: { id }, data: dto });
  }
}
