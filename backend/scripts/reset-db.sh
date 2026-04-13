#!/bin/bash

# Banduka POS - Database Reset Script
# WARNING: This will delete all data and recreate the database

set -e

echo "⚠️  WARNING: Database Reset"
echo "=============================="
echo ""
echo "This will:"
echo "  - Drop all tables"
echo "  - Delete all data"
echo "  - Recreate schema"
echo "  - Seed with test data"
echo ""

# Confirm in production
if [ "${NODE_ENV}" = "production" ]; then
    echo "❌ Error: Cannot reset database in production!"
    exit 1
fi

read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled"
    exit 0
fi

echo ""
echo "🔄 Resetting database..."
echo ""

# Reset database
npx prisma migrate reset --force

echo ""
echo "✨ Database reset complete!"
echo ""
