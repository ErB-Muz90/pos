#!/bin/bash

# Apply TimescaleDB Configuration
# This script sets up TimescaleDB hypertables and continuous aggregates

set -e

echo "🚀 Applying TimescaleDB Configuration"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Extract database connection details from DATABASE_URL
DB_URL="${DATABASE_URL}"

echo "📋 Configuration:"
echo "   Database: ${DB_URL}"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! psql "${DB_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to PostgreSQL!"
    echo "   Please ensure PostgreSQL is running."
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Check if TimescaleDB extension is available
echo "🔍 Checking TimescaleDB extension..."
if ! psql "${DB_URL}" -c "SELECT * FROM pg_extension WHERE extname = 'timescaledb';" | grep -q timescaledb; then
    echo "⚠️  Warning: TimescaleDB extension not found!"
    echo "   Installing TimescaleDB extension..."
    psql "${DB_URL}" -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
fi
echo "✅ TimescaleDB extension is available"
echo ""

# Apply TimescaleDB setup
echo "📦 Applying TimescaleDB configuration..."
psql "${DB_URL}" -f scripts/setup-timescaledb.sql

echo ""
echo "✨ TimescaleDB configuration applied successfully!"
echo ""
echo "📝 What was configured:"
echo "   ✓ Sales table converted to hypertable"
echo "   ✓ Automatic compression (after 1 month)"
echo "   ✓ Data retention policy (3 years)"
echo "   ✓ Continuous aggregates (hourly & daily)"
echo "   ✓ Optimized time-series indexes"
echo "   ✓ Helper functions for analytics"
echo ""
