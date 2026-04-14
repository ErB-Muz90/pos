import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const LOCKED_STATUSES = ['Approved', 'Converted', 'Invoiced'];

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

  async update(id: string, dto: any, organizationId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id, organizationId } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (LOCKED_STATUSES.includes(quote.status)) {
      throw new ForbiddenException(`Quotation is ${quote.status} and cannot be edited. Create a new revision.`);
    }
    return this.prisma.quotation.update({ where: { id }, data: dto });
  }

  async approve(id: string, approverId: string, organizationId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id, organizationId } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (quote.status !== 'Sent' && quote.status !== 'Draft') {
      throw new BadRequestException(`Cannot approve a quotation with status: ${quote.status}`);
    }
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      throw new BadRequestException('Quotation has expired. Create a new revision.');
    }
    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'Approved',
        notes: quote.notes
          ? `${quote.notes} | Approved by ${approverId} at ${new Date().toISOString()}`
          : `Approved by ${approverId} at ${new Date().toISOString()}`,
      },
    });
  }

  async reject(id: string, reason: string, organizationId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id, organizationId } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (LOCKED_STATUSES.includes(quote.status)) {
      throw new ForbiddenException(`Cannot reject a ${quote.status} quotation`);
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: 'Rejected', notes: `Rejected: ${reason}` },
    });
  }

  async remove(id: string, organizationId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id, organizationId } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (quote.status !== 'Draft') {
      throw new ForbiddenException(`Only Draft quotations can be deleted. This quotation is ${quote.status}.`);
    }
    return this.prisma.quotation.delete({ where: { id } });
  }
}
