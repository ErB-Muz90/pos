import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(organizationId: string) {
    const row = await this.prisma.orgSettings.findUnique({ where: { organizationId } });
    return row?.data ?? {};
  }

  async upsert(organizationId: string, data: any) {
    return this.prisma.orgSettings.upsert({
      where: { organizationId },
      create: { organizationId, data },
      update: { data },
    });
  }
}
