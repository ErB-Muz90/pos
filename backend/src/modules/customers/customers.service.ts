import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createCustomerDto: CreateCustomerDto) {
    // Check if customerCode already exists (if provided)
    if (createCustomerDto.code) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          customerCode: createCustomerDto.code,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Customer code already exists');
      }
    }

    // Check if email already exists (if provided)
    if (createCustomerDto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          email: createCustomerDto.email,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Customer email already exists');
      }
    }

    return this.prisma.customer.create({
      data: {
        customerCode: createCustomerDto.code,
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        taxPin: createCustomerDto.taxPin,
        physicalAddress: createCustomerDto.address,
        county: createCustomerDto.country,
        town: createCustomerDto.city,
        isBusiness: createCustomerDto.type === 'business',
        organizationId,
        creditLimit: createCustomerDto.creditLimit,
        loyaltyPoints: createCustomerDto.loyaltyPoints,
      },
    });
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    type?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              sales: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        sales: {
          where: { status: 'completed' },
          select: {
            id: true,
            receiptNumber: true,
            totalAmount: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate total purchases
    const stats = await this.prisma.sale.aggregate({
      where: {
        customerId: id,
        status: 'completed',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    return {
      ...customer,
      stats: {
        totalPurchases: stats._sum.totalAmount || 0,
        totalTransactions: stats._count,
      },
    };
  }

  async update(
    id: string,
    organizationId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    // Verify customer exists
    await this.findOne(id, organizationId);

    // Check code conflict if updating
    if (updateCustomerDto.code) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          customerCode: updateCustomerDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Customer code already exists');
      }
    }

    // Check email conflict if updating
    if (updateCustomerDto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          email: updateCustomerDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException('Customer email already exists');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(updateCustomerDto.code !== undefined
          ? { customerCode: updateCustomerDto.code }
          : {}),
        ...(updateCustomerDto.name !== undefined
          ? { name: updateCustomerDto.name }
          : {}),
        ...(updateCustomerDto.email !== undefined
          ? { email: updateCustomerDto.email }
          : {}),
        ...(updateCustomerDto.phone !== undefined
          ? { phone: updateCustomerDto.phone }
          : {}),
        ...(updateCustomerDto.taxPin !== undefined
          ? { taxPin: updateCustomerDto.taxPin }
          : {}),
        ...(updateCustomerDto.address !== undefined
          ? { physicalAddress: updateCustomerDto.address }
          : {}),
        ...(updateCustomerDto.country !== undefined
          ? { county: updateCustomerDto.country }
          : {}),
        ...(updateCustomerDto.city !== undefined
          ? { town: updateCustomerDto.city }
          : {}),
        ...(updateCustomerDto.type !== undefined
          ? { isBusiness: updateCustomerDto.type === 'business' }
          : {}),
        ...(updateCustomerDto.creditLimit !== undefined
          ? { creditLimit: updateCustomerDto.creditLimit }
          : {}),
        ...(updateCustomerDto.loyaltyPoints !== undefined
          ? { loyaltyPoints: updateCustomerDto.loyaltyPoints }
          : {}),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    // Verify customer exists
    await this.findOne(id, organizationId);

    // Soft delete
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateLoyaltyPoints(
    id: string,
    organizationId: string,
    points: number,
  ) {
    const customer = await this.findOne(id, organizationId);

    const newPoints = Number(customer.loyaltyPoints) + points;

    return this.prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: newPoints },
      select: {
        id: true,
        name: true,
        loyaltyPoints: true,
      },
    });
  }

  async getTopCustomers(organizationId: string, limit: number = 10) {
    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        sales: {
          where: { status: 'completed' },
          select: {
            totalAmount: true,
          },
        },
      },
    });

    // Calculate total purchases for each customer
    const customersWithTotal = customers
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        customerCode: customer.customerCode,
        email: customer.email,
        phone: customer.phone,
        // type: customer.type, // Field doesn't exist in schema
        totalPurchases: customer.sales.reduce(
          (sum, sale) => sum + Number(sale.totalAmount),
          0,
        ),
        transactionCount: customer.sales.length,
      }))
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, limit);

    return customersWithTotal;
  }

  async searchByPhone(organizationId: string, phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        organizationId,
        phone,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }
}
