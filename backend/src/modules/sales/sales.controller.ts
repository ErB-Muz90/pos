import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { ShiftsService } from './shifts.service';
import { ReceiptService } from './receipt.service';
import { CreateSaleDto, VoidSaleDto } from './dto/create-sale.dto';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly shiftsService: ShiftsService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Complete a sale transaction' })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  @ApiResponse({ status: 201, description: 'Sale completed successfully' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  completeSale(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.salesService.completeSale(
      createSaleDto,
      userId,
      organizationId,
      idempotencyKey,
    );
  }

  @Get()
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get all sales' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll(
      organizationId,
      +page,
      +limit,
      branchId,
      customerId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.salesService.findOne(id, organizationId);
  }

  @Post(':id/void')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Void a sale' })
  voidSale(
    @Param('id') id: string,
    @Body() voidDto: VoidSaleDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.salesService.voidSale(id, voidDto, userId, userRole);
  }

  @Post('return')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Process a sales return' })
  processReturn(
    @Body() body: { originalSaleId: string; items: Array<{ saleItemId: string; quantity: number }>; reason: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.salesService.processReturn(body.originalSaleId, organizationId, body.items, body.reason, userId);
  }

  // Receipt endpoints
  @Get(':id/receipt')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get receipt data for printing' })
  @ApiResponse({ status: 200, description: 'Receipt data retrieved' })
  getReceipt(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.receiptService.generateReceipt(id, organizationId);
  }

  @Get(':id/receipt/text')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get receipt as plain text for thermal printers' })
  @ApiResponse({ status: 200, description: 'Text receipt generated' })
  async getTextReceipt(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    const text = await this.receiptService.generateTextReceipt(
      id,
      organizationId,
    );
    return { text };
  }

  // Shifts endpoints
  // Gap 1 — S5: Server time endpoint for clock drift computation
  @Get('shifts/server-time')
  @Public()
  @ApiOperation({ summary: 'Get server UTC time for clock drift calibration' })
  getServerTime() {
    return { serverTime: new Date().toISOString() };
  }

  @Post('shifts/open')
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Open a new shift' })
  @ApiResponse({ status: 201, description: 'Shift opened successfully' })
  openShift(
    @Body() openShiftDto: OpenShiftDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('username') username: string,
  ) {
    return this.shiftsService.openShift(
      openShiftDto.branchId,
      openShiftDto.openingCash,
      userId,
      organizationId,
      username,
    );
  }

  @Post('shifts/:id/close')
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Close a shift' })
  closeShift(
    @Param('id') id: string,
    @Body() closeShiftDto: CloseShiftDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.shiftsService.closeShift(
      id,
      closeShiftDto.closingCash,
      closeShiftDto.notes || '',
      userId,
      userRole,
      organizationId,
      closeShiftDto.managerOverride,
    );
  }

  @Get('shifts/current')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get current open shift' })
  @ApiResponse({ status: 200, description: 'Current shift retrieved' })
  getCurrentShift(@CurrentUser('id') userId: string) {
    return this.shiftsService.getCurrentShift(userId);
  }

  @Get('shifts/:id')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get shift summary' })
  @ApiResponse({ status: 200, description: 'Shift summary retrieved' })
  getShiftSummary(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.shiftsService.getShiftSummary(id, organizationId);
  }

  @Get('shifts')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Get all shifts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
  getAllShifts(
    @CurrentUser('organizationId') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftsService.findAll(
      organizationId,
      +page,
      +limit,
      branchId,
      userId,
      status,
    );
  }
}
