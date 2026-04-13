import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
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
