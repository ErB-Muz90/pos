import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TimeClockEventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 200) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.timeClockEvent.findMany({
        where: { organizationId },
        orderBy: { clockInTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timeClockEvent.count({ where: { organizationId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async clockIn(organizationId: string, dto: any) {
    // Prevent double clock-in for same user
    const open = await this.prisma.timeClockEvent.findFirst({
      where: { organizationId, userId: dto.userId, status: 'clocked-in' },
    });
    if (open) throw new BadRequestException('User already clocked in');
    return this.prisma.timeClockEvent.create({
      data: { ...dto, organizationId, status: 'clocked-in' },
    });
  }

  async clockOut(id: string, dto: any, organizationId: string) {
    return this.prisma.timeClockEvent.update({
      where: { id, organizationId },
      data: { clockOutTime: dto.clockOutTime ?? new Date(), status: 'clocked-out', ...dto },
    });
  }

  async update(id: string, dto: any, organizationId: string) {
    return this.prisma.timeClockEvent.update({ where: { id, organizationId }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.timeClockEvent.delete({ where: { id, organizationId } });
  }
}
