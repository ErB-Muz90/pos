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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions('customers.create')
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Customer code or email already exists' })
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(organizationId, createCustomerDto);
  }

  @Get()
  @Permissions('customers.read')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['individual', 'business'] })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.customersService.findAll(
      organizationId,
      +page,
      +limit,
      search,
      type,
    );
  }

  @Get('top')
  @Permissions('customers.read')
  @ApiOperation({ summary: 'Get top customers by purchases' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top customers retrieved' })
  getTopCustomers(
    @CurrentUser('organizationId') organizationId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.customersService.getTopCustomers(organizationId, +limit);
  }

  @Get('phone/:phone')
  @Permissions('customers.read')
  @ApiOperation({ summary: 'Search customer by phone number' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  searchByPhone(
    @Param('phone') phone: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.customersService.searchByPhone(organizationId, phone);
  }

  @Get(':id')
  @Permissions('customers.read')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.customersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Permissions('customers.update')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, organizationId, updateCustomerDto);
  }

  @Delete(':id')
  @Permissions('customers.delete')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.customersService.remove(id, organizationId);
  }

  @Patch(':id/loyalty-points')
  @Permissions('customers.update')
  @ApiOperation({ summary: 'Update customer loyalty points' })
  @ApiResponse({ status: 200, description: 'Loyalty points updated' })
  updateLoyaltyPoints(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() body: { points: number },
  ) {
    return this.customersService.updateLoyaltyPoints(
      id,
      organizationId,
      body.points,
    );
  }
}
