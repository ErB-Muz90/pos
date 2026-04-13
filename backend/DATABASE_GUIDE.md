# Database Management Guide

## Quick Start

### 1. Initialize Database (First Time Setup)
```bash
# Make sure PostgreSQL is running (via Docker)
docker-compose up -d

# Initialize database with schema and seed data
./scripts/init-db.sh

# OR manually:
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 2. Reset Database (Development Only)
```bash
# This will delete all data and recreate from scratch
./scripts/reset-db.sh

# OR manually:
npx prisma migrate reset
```

## Common Commands

### Prisma Client
```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# View database in GUI
npm run prisma:studio
```

### Migrations
```bash
# Create a new migration (development)
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:prod

# Check migration status
npx prisma migrate status

# Resolve migration issues
npx prisma migrate resolve
```

### Seeding
```bash
# Seed database with test data
npm run prisma:seed

# Seed automatically runs after: npx prisma migrate reset
```

### Database Inspection
```bash
# Pull schema from existing database
npx prisma db pull

# Push schema to database (without migrations)
npx prisma db push

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

## Test Data

After seeding, you'll have:

### Users
| Username | Password      | Role    | PIN  |
|----------|---------------|---------|------|
| admin    | Password123!  | admin   | 1234 |
| manager  | Password123!  | manager | 1234 |
| cashier  | Password123!  | cashier | 1234 |

### Organization
- **Name:** Demo Store Ltd
- **Tax PIN:** P051234567X
- **Branches:** Main Branch (Nairobi CBD), Westlands Branch

### Products
- 6 products across 3 categories (Electronics, Clothing, Food & Beverages)
- Each product has inventory in both branches

### Customers
- 3 test customers (2 individuals, 1 business)
- With loyalty points and credit limits

## Database Schema

### Core Tables
- `organizations` - Multi-tenant foundation
- `branches` - Physical locations
- `users` - Staff members with authentication
- `categories` - Product categories (hierarchical)
- `products` - Product catalog
- `branch_inventory` - Stock levels per branch
- `customers` - Customer database
- `shifts` - Cashier shift management
- `sales` - Sales transactions
- `sale_items` - Line items
- `payments` - Payment records

## Troubleshooting

### Cannot connect to database
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker-compose up -d postgres

# Check connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Migration conflicts
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Mark migration as applied
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

### Schema out of sync
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema changes (development)
npx prisma db push

# Create new migration
npm run prisma:migrate
```

### Seed errors
```bash
# Check if database is empty
npx prisma studio

# Reset and reseed
./scripts/reset-db.sh

# Run seed manually with error details
npx ts-node prisma/seed.ts
```

## Production Deployment

### Initial Setup
```bash
# Set environment
export NODE_ENV=production

# Run migrations
npm run prisma:migrate:prod

# Generate Prisma Client
npm run prisma:generate
```

### Updates
```bash
# 1. Create migration in development
npm run prisma:migrate

# 2. Commit migration files
git add prisma/migrations
git commit -m "Add migration: <description>"

# 3. Deploy to production
npm run prisma:migrate:prod
```

## Backup & Restore

### Backup
```bash
# Backup entire database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump $DATABASE_URL -t organizations -t users > backup_users.sql
```

### Restore
```bash
# Restore from backup
psql $DATABASE_URL < backup_20241104_120000.sql

# Restore specific tables
psql $DATABASE_URL < backup_users.sql
```

## Performance Tips

1. **Indexes**: Already configured in schema for common queries
2. **Connection Pooling**: Configured in Prisma (default: 10 connections)
3. **Query Optimization**: Use Prisma Studio to inspect slow queries
4. **Batch Operations**: Use `createMany`, `updateMany` for bulk operations

## Security

1. **Never commit** `.env` file
2. **Rotate credentials** regularly
3. **Use strong passwords** in production
4. **Enable SSL** for database connections in production
5. **Backup regularly** (automated daily backups recommended)

## Support

For issues:
1. Check logs: `docker logs banduka-postgres`
2. Verify schema: `npx prisma validate`
3. Check migrations: `npx prisma migrate status`
4. Review Prisma docs: https://www.prisma.io/docs
