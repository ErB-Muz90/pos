import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Blocks mutating requests (POST/PUT/PATCH/DELETE) when the org's
 * subscription is expired. Apply per-controller or per-route.
 *
 * GET requests are always allowed so users can still read their data.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Read-only requests always pass
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const org = req.user?.organization;
    if (!org) return true; // no org context — let JwtAuthGuard handle it

    // Super admins are not bound to any org subscription
    if (req.user?.role === 'superadmin') return true;

    if (org.subscriptionStatus === 'expired') {
      throw new ForbiddenException('Subscription expired. Please renew to continue.');
    }

    if (org.subscriptionExpiresAt && new Date(org.subscriptionExpiresAt) < new Date()) {
      throw new ForbiddenException('Subscription expired. Please renew to continue.');
    }

    return true;
  }
}
