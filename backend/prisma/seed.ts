import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.payment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.branchInventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.organization.deleteMany();
  }

  // 1. Create Organization
  console.log('📦 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Store Ltd',
      businessType: 'retail',
      taxPin: 'P051234567X',
      physicalAddress: '123 Kenyatta Avenue, Nairobi',
      phone: '+254712345678',
      email: 'info@demostore.co.ke',
      etimsEnvironment: 'sandbox',
      etimsBhfId: '00',
      etimsTin: 'P051234567X',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      maxBranches: 5,
      maxUsers: 20,
      features: {
        accounting: true,
        inventory: true,
        customers: true,
        reports: true,
        multiCurrency: false,
      },
    },
  });
  console.log(`✅ Organization created: ${organization.name}`);

  // 2. Create Branches
  console.log('🏢 Creating branches...');
  const mainBranch = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Main Branch',
      code: 'MAIN-001',
      county: 'Nairobi',
      town: 'Nairobi CBD',
      physicalAddress: '123 Kenyatta Avenue, Nairobi',
      etimsBhfId: '00',
      isPrimary: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Westlands Branch',
      code: 'WEST-001',
      county: 'Nairobi',
      town: 'Westlands',
      physicalAddress: '456 Waiyaki Way, Westlands',
      etimsBhfId: '01',
      isPrimary: false,
    },
  });
  console.log(`✅ Created ${2} branches`);

  // 3. Create Users
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const pinHash = await bcrypt.hash('1234', 10);

  const adminUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      branchId: mainBranch.id,
      username: 'admin',
      email: 'admin@demostore.co.ke',
      phone: '+254712345678',
      passwordHash,
      pinHash,
      fullName: 'System Administrator',
      role: 'admin',
      employeeCode: 'EMP-001',
      permissions: {
        sales: { create: true, read: true, update: true, delete: true, void: true },
        products: { create: true, read: true, update: true, delete: true },
        inventory: { create: true, read: true, update: true, delete: true },
        customers: { create: true, read: true, update: true, delete: true },
        users: { create: true, read: true, update: true, delete: true },
        reports: { read: true, export: true },
        settings: { read: true, update: true },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      branchId: mainBranch.id,
      username: 'manager',
      email: 'manager@demostore.co.ke',
      passwordHash,
      pinHash,
      fullName: 'Branch Manager',
      role: 'manager',
      employeeCode: 'EMP-002',
      permissions: {
        sales: { create: true, read: true, update: true, void: true },
        products: { create: true, read: true, update: true },
        inventory: { create: true, read: true, update: true },
        customers: { create: true, read: true, update: true },
        reports: { read: true, export: true },
      },
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      branchId: mainBranch.id,
      username: 'cashier',
      email: 'cashier@demostore.co.ke',
      passwordHash,
      pinHash,
      fullName: 'John Cashier',
      role: 'cashier',
      employeeCode: 'EMP-003',
      permissions: {
        sales: { create: true, read: true },
        products: { read: true },
        customers: { create: true, read: true },
      },
    },
  });
  console.log(`✅ Created ${3} users`);

  // 4. Create Categories
  console.log('📂 Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      organizationId: organization.id,
      name: 'Electronics',
      code: 'ELEC',
      description: 'Electronic devices and accessories',
      defaultTaxRate: 16.0,
      taxType: 'VAT',
      sortOrder: 1,
    },
  });

  const clothingCategory = await prisma.category.create({
    data: {
      organizationId: organization.id,
      name: 'Clothing',
      code: 'CLOTH',
      description: 'Apparel and fashion items',
      defaultTaxRate: 16.0,
      taxType: 'VAT',
      sortOrder: 2,
    },
  });

  const foodCategory = await prisma.category.create({
    data: {
      organizationId: organization.id,
      name: 'Food & Beverages',
      code: 'FOOD',
      description: 'Food items and drinks',
      defaultTaxRate: 16.0,
      taxType: 'VAT',
      sortOrder: 3,
    },
  });
  console.log(`✅ Created ${3} categories`);

  // 5. Create Products
  console.log('📦 Creating products...');
  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: electronicsCategory.id,
        name: 'Samsung Galaxy A54',
        description: '5G Smartphone with 128GB storage',
        sku: 'PHONE-SAM-A54',
        barcode: '8806094937267',
        costPrice: 35000,
        sellingPrice: 42000,
        wholesalePrice: 40000,
        minimumPrice: 38000,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'piece',
        reorderLevel: 5,
        reorderQuantity: 10,
        etimsItemClsCd: '4622',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'EA',
      },
    }),
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: electronicsCategory.id,
        name: 'HP Laptop 15-dw3000',
        description: 'Intel Core i5, 8GB RAM, 512GB SSD',
        sku: 'LAPTOP-HP-15',
        barcode: '194850123456',
        costPrice: 55000,
        sellingPrice: 68000,
        wholesalePrice: 65000,
        minimumPrice: 60000,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'piece',
        reorderLevel: 3,
        reorderQuantity: 5,
        etimsItemClsCd: '4622',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'EA',
      },
    }),
    // Clothing
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: clothingCategory.id,
        name: 'Cotton T-Shirt - Blue',
        description: '100% cotton, comfortable fit',
        sku: 'TSHIRT-COT-BLU',
        barcode: '5012345678901',
        costPrice: 500,
        sellingPrice: 800,
        wholesalePrice: 700,
        minimumPrice: 600,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'piece',
        reorderLevel: 20,
        reorderQuantity: 50,
        etimsItemClsCd: '6211',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'EA',
      },
    }),
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: clothingCategory.id,
        name: 'Denim Jeans - Black',
        description: 'Classic fit denim jeans',
        sku: 'JEANS-DEN-BLK',
        barcode: '5012345678902',
        costPrice: 1200,
        sellingPrice: 1800,
        wholesalePrice: 1600,
        minimumPrice: 1400,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'piece',
        reorderLevel: 15,
        reorderQuantity: 30,
        etimsItemClsCd: '6203',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'EA',
      },
    }),
    // Food
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: foodCategory.id,
        name: 'Coca Cola 500ml',
        description: 'Carbonated soft drink',
        sku: 'DRINK-COCA-500',
        barcode: '5449000000996',
        costPrice: 40,
        sellingPrice: 60,
        wholesalePrice: 55,
        minimumPrice: 50,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'bottle',
        reorderLevel: 100,
        reorderQuantity: 200,
        etimsItemClsCd: '2202',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'BT',
      },
    }),
    prisma.product.create({
      data: {
        organizationId: organization.id,
        categoryId: foodCategory.id,
        name: 'Bread - White Loaf',
        description: 'Fresh white bread',
        sku: 'FOOD-BREAD-WHT',
        barcode: '6001087340014',
        costPrice: 35,
        sellingPrice: 50,
        wholesalePrice: 45,
        minimumPrice: 40,
        taxRate: 16.0,
        taxInclusive: true,
        trackInventory: true,
        unitOfMeasure: 'loaf',
        reorderLevel: 50,
        reorderQuantity: 100,
        etimsItemClsCd: '1905',
        etimsItemTyCd: '2',
        etimsPkgUnitCd: 'EA',
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // 6. Create Branch Inventory
  console.log('📊 Creating inventory records...');
  for (const product of products) {
    await prisma.branchInventory.create({
      data: {
        productId: product.id,
        branchId: mainBranch.id,
        quantity: 50,
        reservedQuantity: 0,
        averageCost: product.costPrice,
      },
    });

    await prisma.branchInventory.create({
      data: {
        productId: product.id,
        branchId: branch2.id,
        quantity: 30,
        reservedQuantity: 0,
        averageCost: product.costPrice,
      },
    });
  }
  console.log(`✅ Created inventory for ${products.length} products across 2 branches`);

  // 7. Create Customers
  console.log('👤 Creating customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        customerCode: 'CUST-001',
        name: 'Jane Doe',
        phone: '+254722123456',
        email: 'jane.doe@example.com',
        county: 'Nairobi',
        town: 'Nairobi',
        creditLimit: 10000,
        loyaltyPoints: 150,
        tags: ['vip', 'regular'],
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        customerCode: 'CUST-002',
        name: 'ABC Company Ltd',
        phone: '+254733234567',
        email: 'info@abccompany.co.ke',
        taxPin: 'P052345678Y',
        county: 'Nairobi',
        town: 'Westlands',
        isBusiness: true,
        businessName: 'ABC Company Ltd',
        creditLimit: 50000,
        loyaltyPoints: 500,
        tags: ['wholesale', 'corporate'],
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: organization.id,
        customerCode: 'CUST-003',
        name: 'John Smith',
        phone: '+254744345678',
        email: 'john.smith@example.com',
        county: 'Nairobi',
        town: 'Karen',
        creditLimit: 5000,
        loyaltyPoints: 75,
        tags: ['regular'],
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  console.log('\n✨ Seeding completed successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('   Admin:   username: admin    | password: Password123!');
  console.log('   Manager: username: manager  | password: Password123!');
  console.log('   Cashier: username: cashier  | password: Password123!');
  console.log('   PIN for all users: 1234\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
