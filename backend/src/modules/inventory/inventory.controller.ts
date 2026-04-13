import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  AdjustInventoryDto,
  TransferInventoryDto,
  ReceiveStockDto,
} from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('branch/:branchId')
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Get inventory for a branch' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Inventory retrieved successfully' })
  getBranchInventory(
    @Param('branchId') branchId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.getBranchInventory(
      organizationId,
      branchId,
      +page,
      +limit,
      search,
      lowStock === 'true',
    );
  }

  @Get('product/:productId')
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Get inventory for a product across all branches' })
  @ApiResponse({ status: 200, description: 'Product inventory retrieved' })
  getProductInventory(
    @Param('productId') productId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.inventoryService.getProductInventory(organizationId, productId);
  }

  @Post('adjust')
  @Permissions('inventory.update')
  @ApiOperation({ summary: 'Adjust inventory (increase/decrease)' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory' })
  adjustInventory(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() adjustDto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjustInventory(
      organizationId,
      userId,
      adjustDto,
    );
  }

  @Post('transfer')
  @Permissions('inventory.update')
  @ApiOperation({ summary: 'Transfer inventory between branches' })
  @ApiResponse({ status: 200, description: 'Inventory transferred successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory or invalid branches' })
  transferInventory(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() transferDto: TransferInventoryDto,
  ) {
    return this.inventoryService.transferInventory(
      organizationId,
      userId,
      transferDto,
    );
  }

  @Post('receive')
  @Permissions('inventory.create')
  @ApiOperation({ summary: 'Receive stock (purchase/restock)' })
  @ApiResponse({ status: 200, description: 'Stock received successfully' })
  receiveStock(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() receiveDto: ReceiveStockDto,
  ) {
    return this.inventoryService.receiveStock(
      organizationId,
      userId,
      receiveDto,
    );
  }

  @Get('movements')
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Get inventory movement history' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Movements retrieved successfully' })
  getMovements(
    @CurrentUser('organizationId') organizationId: string,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.inventoryService.getMovements(
      organizationId,
      branchId,
      productId,
      +page,
      +limit,
    );
  }
}
