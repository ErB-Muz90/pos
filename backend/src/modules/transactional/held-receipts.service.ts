import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HeldReceiptsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.heldReceipt.findMany({ where: { organizationId }, orderBy: { heldAt: 'desc' } });
  }

  async create(organizationId: string, dto: any) {
    return this.prisma.heldReceipt.create({ data: { ...dto, organizationId } });
  }

  async remove(id: string) {
    return this.prisma.heldReceipt.delete({ where: { id } });
  }
}
