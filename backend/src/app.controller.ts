import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check — pings DB and Redis' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth(): Promise<object> {
    return this.appService.getHealth();
  }

  @Public()
  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  getVersion(): object {
    return this.appService.getVersion();
  }
}
