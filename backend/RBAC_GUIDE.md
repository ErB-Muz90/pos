# Role-Based Access Control (RBAC) Guide

## Overview

Banduka POS implements a flexible two-tier authorization system:
1. **Role-Based Access** - Coarse-grained access control by user role
2. **Permission-Based Access** - Fine-grained access control by specific permissions

## User Roles

### 1. Admin
**Full system access** - Can perform all operations

**Typical Users:**
- System administrators
- Business owners
- IT staff

**Default Permissions:** ALL

### 2. Manager
**Branch management and oversight**

**Typical Users:**
- Branch managers
- Store supervisors

**Default Permissions:**
```json
{
  "sales": { "create": true, "read": true, "update": true, "void": true },
  "products": { "create": true, "read": true, "update": true },
  "inventory": { "create": true, "read": true, "update": true },
  "customers": { "create": true, "read": true, "update": true },
  "reports": { "read": true, "export": true },
  "users": { "read": true }
}
```

### 3. Cashier
**Point of sale operations**

**Typical Users:**
- Cashiers
- Sales staff
- Front desk personnel

**Default Permissions:**
```json
{
  "sales": { "create": true, "read": true },
  "products": { "read": true },
  "customers": { "create": true, "read": true },
  "inventory": { "read": true }
}
```

### 4. Accountant
**Financial operations and reporting**

**Typical Users:**
- Accountants
- Financial controllers
- Bookkeepers

**Default Permissions:**
```json
{
  "sales": { "read": true },
  "reports": { "read": true, "export": true },
  "accounting": { "create": true, "read": true, "update": true },
  "expenses": { "create": true, "read": true, "update": true }
}
```

## Permission Structure

Permissions are stored as nested JSON objects:

```typescript
{
  "resource": {
    "action": boolean
  }
}
```

### Available Resources

- `sales` - Sales transactions
- `products` - Product catalog
- `inventory` - Stock management
- `customers` - Customer database
- `users` - User management
- `reports` - Reports and analytics
- `accounting` - Accounting entries
- `expenses` - Expense tracking
- `settings` - System settings

### Available Actions

- `create` - Create new records
- `read` - View records
- `update` - Modify existing records
- `delete` - Delete records
- `void` - Void transactions
- `export` - Export data

## Usage in Controllers

### 1. Role-Based Protection

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  
  // Only admin and manager can create products
  @Post()
  @Roles('admin', 'manager')
  createProduct() {
    // ...
  }
  
  // All authenticated users can view products
  @Get()
  getProducts() {
    // ...
  }
}
```

### 2. Permission-Based Protection

```typescript
import { Controller, Post, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  
  // Requires 'sales.create' permission
  @Post()
  @Permissions('sales.create')
  createSale() {
    // ...
  }
  
  // Requires 'sales.void' permission
  @Delete(':id')
  @Permissions('sales.void')
  voidSale() {
    // ...
  }
}
```

### 3. Combined Protection

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UsersController {
  
  // Must be admin OR have 'users.create' permission
  @Post()
  @Roles('admin')
  @Permissions('users.create')
  createUser() {
    // Admin always passes
    // Others need 'users.create' permission
  }
}
```

### 4. Public Routes

```typescript
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  
  // No authentication required
  @Post('login')
  @Public()
  login() {
    // ...
  }
}
```

## Permission Management

### Checking Permissions in Code

```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
export class SalesController {
  
  @Get()
  getSales(@CurrentUser() user: any) {
    // Check if user has permission
    if (user.permissions?.sales?.read) {
      // User can read sales
    }
    
    // Check role
    if (user.role === 'admin') {
      // Admin access
    }
  }
}
```

### Updating User Permissions

```typescript
// In UsersService
async updatePermissions(userId: string, permissions: Record<string, any>) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { permissions }
  });
}

// Example usage
await usersService.updatePermissions(userId, {
  sales: { create: true, read: true, update: true },
  products: { read: true },
  reports: { read: true, export: true }
});
```

## Default Permission Sets

### Starter Template (Cashier)
```json
{
  "sales": { "create": true, "read": true },
  "products": { "read": true },
  "customers": { "create": true, "read": true }
}
```

### Manager Template
```json
{
  "sales": { "create": true, "read": true, "update": true, "void": true },
  "products": { "create": true, "read": true, "update": true },
  "inventory": { "create": true, "read": true, "update": true },
  "customers": { "create": true, "read": true, "update": true, "delete": true },
  "reports": { "read": true, "export": true },
  "users": { "read": true }
}
```

### Accountant Template
```json
{
  "sales": { "read": true },
  "expenses": { "create": true, "read": true, "update": true },
  "accounting": { "create": true, "read": true, "update": true },
  "reports": { "read": true, "export": true }
}
```

## Security Best Practices

### 1. Principle of Least Privilege
Grant users only the permissions they need to perform their job.

```typescript
// Good ✓
const cashierPermissions = {
  sales: { create: true, read: true },
  products: { read: true }
};

// Bad ✗ (too many permissions for a cashier)
const cashierPermissions = {
  sales: { create: true, read: true, update: true, delete: true, void: true },
  products: { create: true, read: true, update: true, delete: true },
  users: { create: true, read: true, update: true }
};
```

### 2. Always Use Guards
Never rely on client-side permission checks alone.

```typescript
// Good ✓
@Post()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('sales.void')
voidSale() {
  // Protected by guard
}

// Bad ✗
@Post()
voidSale(@CurrentUser() user: any) {
  // Manual check - can be bypassed
  if (!user.permissions?.sales?.void) {
    throw new ForbiddenException();
  }
}
```

### 3. Validate Organization Context
Ensure users can only access their organization's data.

```typescript
@Get(':id')
async getSale(@Param('id') id: string, @CurrentUser() user: any) {
  const sale = await this.salesService.findOne(id);
  
  // Verify sale belongs to user's organization
  if (sale.organizationId !== user.organizationId) {
    throw new ForbiddenException('Access denied');
  }
  
  return sale;
}
```

### 4. Audit Permission Changes
Log all permission modifications for security auditing.

```typescript
async updatePermissions(userId: string, newPermissions: any, adminId: string) {
  // Update permissions
  await this.prisma.user.update({
    where: { id: userId },
    data: { permissions: newPermissions }
  });
  
  // Log the change
  await this.auditLog.log({
    action: 'PERMISSIONS_UPDATED',
    userId: adminId,
    targetUserId: userId,
    changes: newPermissions
  });
}
```

## Testing Permissions

### Unit Test Example

```typescript
describe('SalesController', () => {
  it('should allow admin to void sales', async () => {
    const adminUser = { role: 'admin', permissions: {} };
    
    const result = await controller.voidSale('sale-id', adminUser);
    
    expect(result).toBeDefined();
  });
  
  it('should deny cashier from voiding sales', async () => {
    const cashierUser = { 
      role: 'cashier', 
      permissions: { sales: { create: true, read: true } }
    };
    
    await expect(
      controller.voidSale('sale-id', cashierUser)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

## Common Patterns

### 1. Resource Owner Check
```typescript
async updateCustomer(id: string, data: any, user: any) {
  const customer = await this.findOne(id);
  
  // Only allow if same organization
  if (customer.organizationId !== user.organizationId) {
    throw new ForbiddenException();
  }
  
  return this.update(id, data);
}
```

### 2. Branch-Level Access
```typescript
async getSales(user: any) {
  // Managers see only their branch
  if (user.role === 'manager') {
    return this.findByBranch(user.branchId);
  }
  
  // Admins see all branches
  if (user.role === 'admin') {
    return this.findByOrganization(user.organizationId);
  }
}
```

### 3. Dynamic Permissions
```typescript
async canVoidSale(saleId: string, user: any): Promise<boolean> {
  // Admin can always void
  if (user.role === 'admin') return true;
  
  // Check permission
  if (!user.permissions?.sales?.void) return false;
  
  // Additional business rule: can only void own sales
  const sale = await this.findOne(saleId);
  return sale.userId === user.id;
}
```

## Troubleshooting

### Permission Not Working
1. Check guard order: `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)`
2. Verify permission structure in database
3. Check if admin bypass is interfering
4. Ensure JWT token includes user data

### User Can't Access Resource
1. Verify user has correct role
2. Check permission JSON structure
3. Confirm organization/branch context
4. Review audit logs for permission changes

### Too Many Permission Denied Errors
1. Review permission templates
2. Check if guards are too restrictive
3. Verify user roles are assigned correctly
4. Consider using role-based instead of permission-based for simpler cases

## API Endpoints for Permission Management

```typescript
// Get user permissions
GET /api/v1/users/:id/permissions

// Update user permissions (admin only)
PUT /api/v1/users/:id/permissions
Body: {
  "sales": { "create": true, "read": true },
  "products": { "read": true }
}

// Get permission templates
GET /api/v1/permissions/templates

// Check if user has permission
POST /api/v1/permissions/check
Body: {
  "userId": "uuid",
  "permission": "sales.void"
}
```

## Resources

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [OWASP Access Control](https://owasp.org/www-project-top-ten/)
