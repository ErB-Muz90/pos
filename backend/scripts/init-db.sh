#!/bin/bash

# Banduka POS - Database Initialization Script
# This script initializes the database with schema and seed data

set -e

echo "🚀 Banduka POS - Database Initialization"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

echo "📋 Configuration:"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Database: ${DATABASE_URL}"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to PostgreSQL!"
    echo "   Please ensure PostgreSQL is running."
    echo "   If using Docker: docker-compose up -d"
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Create/Update database schema
echo "📦 Creating database schema..."
if [ "${NODE_ENV}" = "production" ]; then
    echo "   Running production migrations..."
    npx prisma migrate deploy
else
    echo "   Running development migrations..."
    npx prisma migrate dev --name init
fi
echo ""

# Seed database (only in development)
if [ "${NODE_ENV}" != "production" ]; then
    echo "🌱 Seeding database with test data..."
    npx ts-node prisma/seed.ts
    echo ""
fi

echo "✨ Database initialization complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the development server: npm run start:dev"
echo "   2. Access API docs: http://localhost:3000/api/docs"
echo "   3. Test credentials are in the seed output above"
echo ""
