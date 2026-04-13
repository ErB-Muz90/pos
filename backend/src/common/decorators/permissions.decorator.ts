import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permissions decorator - Restricts access based on granular permissions
 * @param permissions - Array of required permissions
 * @example @Permissions('sales.create', 'sales.void')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
