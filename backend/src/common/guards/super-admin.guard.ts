import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Restricts a route to platform-level super admins only.
 * Super admins have role === 'superadmin' and are not scoped to any org.
 *
 * Usage: @UseGuards(JwtAuthGuard, SuperAdminGuard)
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (user?.role !== 'superadmin') {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
