import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Fix 4 — valid state transitions
const TRANSITIONS: Record<string, string[]> = {
  Pending:         ['InProgress', 'Cancelled'],
  InProgress:      ['AwaitingParts', 'Ready', 'Cancelled'],
  AwaitingParts:   ['InProgress', 'Cancelled'],
  Ready:           ['Closed', 'Cancelled'],
  Completed:       ['Closed'],
  Closed:          [],
  Cancelled:       [],
  Warranty:        ['InProgress', 'Closed'],
};

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

  async update(id: string, dto: any, organizationId: string) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id, organizationId } });
    if (!wo) throw new BadRequestException('Work order not found');

    const newStatus: string | undefined = dto.status;

    if (newStatus && newStatus !== wo.status) {
      // Fix 4 — transition guard
      const allowed = TRANSITIONS[wo.status] ?? [];
      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Invalid transition: ${wo.status} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      // Fix 4 — block close if balance due > 0
      if (newStatus === 'Closed') {
        const balanceDue = Number(dto.balanceDue ?? (wo as any).balanceDue ?? 0);
        if (balanceDue > 0) {
          throw new BadRequestException(
            `Cannot close work order with outstanding balance of KES ${balanceDue.toFixed(2)}`,
          );
        }
      }
    }

    return this.prisma.workOrder.update({ where: { id }, data: dto });
  }
}
