import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { organizationId, status: 'active' },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where: { organizationId, status: 'active' } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    return this.prisma.supplier.create({ data: { ...dto, organizationId } });
  }

  async update(id: string, dto: any, organizationId: string) {
    return this.prisma.supplier.update({ where: { id, organizationId }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.supplier.update({ where: { id, organizationId }, data: { status: 'deleted' } });
  }
}
