import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles decorator - Restricts access to specific user roles
 * @param roles - Array of allowed roles (admin, manager, cashier, accountant)
 * @example @Roles('admin', 'manager')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
