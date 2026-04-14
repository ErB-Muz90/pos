import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHealth(): Promise<object> {
    const checks: Record<string, string> = {};

    // DB ping
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Redis ping via ioredis if available
    try {
      const redis = (this.prisma as any)._redis;
      if (redis) {
        await redis.ping();
        checks.redis = 'ok';
      } else {
        checks.redis = 'not_configured';
      }
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'not_configured');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks,
    };
  }

  getVersion(): object {
    return {
      version: '1.0.0',
      name: 'Banduka POS API',
      description: 'Production-ready POS system with eTIMS integration',
    };
  }
}
