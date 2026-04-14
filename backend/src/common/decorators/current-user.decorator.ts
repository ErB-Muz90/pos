import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  role: string;
  organizationId?: string | null;
  branchId?: string;
  permissions: Record<string, any>;
  organization?: {
    id: string;
    name: string;
    status: string;
    subscriptionStatus: string;
    subscriptionExpiresAt?: string | Date | null;
    deletedAt?: string | Date | null;
  };
  branch?: {
    id: string;
    name: string;
    status: string;
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
