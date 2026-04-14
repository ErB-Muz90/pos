#!/usr/bin/env ts-node
/**
 * Creates the platform super admin user.
 * Run once after first deploy:
 *   npx ts-node scripts/seed-superadmin.ts
 *
 * Reads credentials from env vars:
 *   SUPERADMIN_USERNAME  (default: superadmin)
 *   SUPERADMIN_EMAIL     (required)
 *   SUPERADMIN_PASSWORD  (required — min 12 chars)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌  Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars before running.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌  SUPERADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({ where: { role: 'superadmin' } });
  if (existing) {
    console.log(`ℹ️  Super admin already exists: ${existing.username} (${existing.email})`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      fullName: 'Platform Super Admin',
      passwordHash,
      role: 'superadmin',
      status: 'active',
      // Platform super admins are not tenant-scoped.
      organizationId: null,
    },
  });

  console.log(`✅  Super admin created:`);
  console.log(`    ID:       ${user.id}`);
  console.log(`    Username: ${user.username}`);
  console.log(`    Email:    ${user.email}`);
  console.log(`\n⚠️  Store these credentials securely. This script will not run again.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
