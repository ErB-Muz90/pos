import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({ where: { organizationId }, orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.expense.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, userId: string, dto: any) {
    return this.prisma.expense.create({ data: { ...dto, organizationId, userId } });
  }

  async update(id: string, organizationId: string, dto: any) {
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
