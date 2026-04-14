import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export const TENANT_MODEL_KEY = 'tenantModel';

/** Decorator to specify which Prisma model to check ownership against */
export const TenantModel = (model: string) =>
  Reflect.metadata(TENANT_MODEL_KEY, model);

/**
 * Verifies that the resource identified by :id in the route params
 * belongs to the requesting user's organization.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, TenantResourceGuard)
 *   @TenantModel('product')
 *   @Get(':id')
 *   findOne(@Param('id') id: string) { ... }
 */
@Injectable()
export class TenantResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const model = this.reflector.get<string>(TENANT_MODEL_KEY, context.getHandler());
    if (!model) return true; // guard is a no-op if no model specified

    const request = context.switchToHttp().getRequest();
    const id = request.params?.id;
    const orgId: string = request.user?.organizationId;

    if (!id || !orgId) return true;

    const record = await (this.prisma as any)[model].findUnique({ where: { id } });

    if (!record) throw new NotFoundException(`${model} not found`);
    if (record.organizationId !== orgId) throw new ForbiddenException('Access denied');

    return true;
  }
}
