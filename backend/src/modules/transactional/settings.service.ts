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

  /** Partial merge — only overwrites the keys provided, preserves the rest */
  async patch(organizationId: string, partial: any) {
    const existing = await this.get(organizationId);
    const merged = this.deepMerge(existing as Record<string, any>, partial);
    return this.upsert(organizationId, merged);
  }

  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
