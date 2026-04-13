import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 400, description: 'User limit reached' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(organizationId, createUserDto);
  }

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all users in organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.usersService.findAll(organizationId, +page, +limit);
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.usersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, organizationId, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.usersService.remove(id, organizationId);
  }

  @Patch(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user permissions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  updatePermissions(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() body: { permissions: Record<string, any> },
  ) {
    return this.usersService.updatePermissions(
      id,
      organizationId,
      body.permissions,
    );
  }

  @Post(':id/reset-password')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetPassword(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.resetPassword(
      id,
      organizationId,
      body.newPassword,
    );
  }

  @Patch(':id/toggle-status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Toggle user active/inactive status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleStatus(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.usersService.toggleStatus(id, organizationId);
  }

  @Post(':id/unlock')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Unlock user account' })
  @ApiResponse({ status: 200, description: 'Account unlocked successfully' })
  unlockAccount(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.usersService.unlockAccount(id, organizationId);
  }
}
