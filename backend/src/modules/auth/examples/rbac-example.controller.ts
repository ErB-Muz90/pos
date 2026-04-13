/**
 * RBAC Example Controller
 * This file demonstrates how to use Role-Based Access Control in your controllers
 * 
 * NOTE: This is an example file for reference. Delete or move to docs folder in production.
 */

import { Controller, Get, Post, Put, Delete, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('examples')
@Controller('examples/rbac')
export class RBACExampleController {
  
  // ============================================================================
  // EXAMPLE 1: Public Route (No Authentication Required)
  // ============================================================================
  
  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Public endpoint - no authentication required' })
  publicEndpoint() {
    return { message: 'This is a public endpoint' };
  }
  
  // ============================================================================
  // EXAMPLE 2: Authenticated Route (Any Logged-in User)
  // ============================================================================
  
  @Get('authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Requires authentication only' })
  authenticatedEndpoint(@CurrentUser() user: any) {
    return {
      message: 'You are authenticated',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
  
  // ============================================================================
  // EXAMPLE 3: Role-Based Access (Admin Only)
  // ============================================================================
  
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin only - role-based access' })
  adminOnlyEndpoint() {
    return { message: 'You are an admin' };
  }
  
  // ============================================================================
  // EXAMPLE 4: Multiple Roles (Admin OR Manager)
  // ============================================================================
  
  @Get('management')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin or Manager - multiple roles allowed' })
  managementEndpoint(@CurrentUser('role') role: string) {
    return { message: `You are a ${role}` };
  }
  
  // ============================================================================
  // EXAMPLE 5: Permission-Based Access
  // ============================================================================
  
  @Post('create-sale')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sales.create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Requires sales.create permission' })
  createSaleEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Sale created',
      createdBy: user.username,
    };
  }
  
  // ============================================================================
  // EXAMPLE 6: Multiple Permissions (AND Logic)
  // ============================================================================
  
  @Delete('void-sale/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sales.void', 'sales.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Requires BOTH sales.void AND sales.update' })
  voidSaleEndpoint(@Param('id') id: string) {
    return { message: `Sale ${id} voided` };
  }
  
  // ============================================================================
  // EXAMPLE 7: Combined Role and Permission
  // ============================================================================
  
  @Put('update-user/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('users.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Requires (admin OR manager) AND users.update permission',
    description: 'Admin always passes. Managers need users.update permission.'
  })
  updateUserEndpoint(@Param('id') id: string) {
    return { message: `User ${id} updated` };
  }
  
  // ============================================================================
  // EXAMPLE 8: Organization Context Validation
  // ============================================================================
  
  @Get('sales/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('sales.read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sale with organization validation' })
  getSaleEndpoint(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // In real implementation, you would:
    // 1. Fetch the sale from database
    // 2. Verify sale.organizationId === user.organizationId
    // 3. Return sale or throw ForbiddenException
    
    return {
      message: 'Sale retrieved',
      organizationId: user.organizationId,
      saleId: id,
    };
  }
  
  // ============================================================================
  // EXAMPLE 9: Branch-Level Access
  // ============================================================================
  
  @Get('branch-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'cashier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sales filtered by user branch' })
  getBranchSalesEndpoint(@CurrentUser() user: any) {
    // Managers and cashiers only see their branch data
    return {
      message: 'Branch sales',
      branchId: user.branchId,
      branchName: user.branch?.name,
    };
  }
  
  // ============================================================================
  // EXAMPLE 10: Dynamic Permission Check
  // ============================================================================
  
  @Get('check-permission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  checkPermissionEndpoint(@CurrentUser() user: any) {
    const hasVoidPermission = user.permissions?.sales?.void === true;
    const hasCreatePermission = user.permissions?.sales?.create === true;
    
    return {
      username: user.username,
      role: user.role,
      permissions: {
        'sales.void': hasVoidPermission,
        'sales.create': hasCreatePermission,
      },
    };
  }
  
  // ============================================================================
  // EXAMPLE 11: Get Current User Info
  // ============================================================================
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  getCurrentUserEndpoint(@CurrentUser() user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
      organization: user.organization,
      branch: user.branch,
      permissions: user.permissions,
    };
  }
  
  // ============================================================================
  // EXAMPLE 12: Admin Bypass
  // ============================================================================
  
  @Get('admin-bypass')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('reports.export')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Admin always passes, others need reports.export',
    description: 'Admins bypass permission checks automatically'
  })
  adminBypassEndpoint(@CurrentUser() user: any) {
    return {
      message: user.role === 'admin' 
        ? 'Admin access granted automatically' 
        : 'Access granted via reports.export permission',
      role: user.role,
    };
  }
}

/**
 * USAGE SUMMARY:
 * 
 * 1. @Public() - No authentication
 * 2. @UseGuards(JwtAuthGuard) - Requires login
 * 3. @Roles('admin') - Requires specific role
 * 4. @Roles('admin', 'manager') - Requires ANY of the roles (OR logic)
 * 5. @Permissions('sales.create') - Requires specific permission
 * 6. @Permissions('sales.void', 'sales.update') - Requires ALL permissions (AND logic)
 * 7. Combine @Roles and @Permissions for complex access control
 * 8. Use @CurrentUser() to access authenticated user data
 * 9. Always validate organization/branch context in business logic
 * 10. Admin role bypasses permission checks automatically
 */
