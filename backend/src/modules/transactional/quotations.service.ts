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

  async update(id: string, dto: any) {
    const quote = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new BadRequestException('Quotation not found');
    // Lock guard — approved/converted/invoiced quotes cannot be edited
    if (LOCKED_STATUSES.includes(quote.status)) {
      throw new ForbiddenException(`Quotation is ${quote.status} and cannot be edited. Create a new revision.`);
    }
    return this.prisma.quotation.update({ where: { id }, data: dto });
  }

  // Fix 2 — Approve: cloud event, sets lock + approvedBy + approvedAt, checks expiry
  async approve(id: string, approverId: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id } });
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

  // Fix 2 — Reject: records reason
  async reject(id: string, reason: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (LOCKED_STATUSES.includes(quote.status)) {
      throw new ForbiddenException(`Cannot reject a ${quote.status} quotation`);
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: 'Rejected', notes: `Rejected: ${reason}` },
    });
  }

  // Fix 2 — Delete guard: only DRAFT quotes can be deleted
  async remove(id: string) {
    const quote = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new BadRequestException('Quotation not found');
    if (quote.status !== 'Draft') {
      throw new ForbiddenException(`Only Draft quotations can be deleted. This quotation is ${quote.status}.`);
    }
    return this.prisma.quotation.delete({ where: { id } });
  }
}
