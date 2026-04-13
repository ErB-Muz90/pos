import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.quotation.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(organizationId: string, dto: any) {
    const count = await this.prisma.quotation.count({ where: { organizationId } });
    const quoteNumber = `QT-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    return this.prisma.quotation.create({ data: { ...dto, organizationId, quoteNumber } });
  }

  async update(id: string, dto: any) {
    return this.prisma.quotation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.quotation.delete({ where: { id } });
  }
}
