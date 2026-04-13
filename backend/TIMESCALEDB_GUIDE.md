# TimescaleDB Integration Guide

## Overview

TimescaleDB extends PostgreSQL with powerful time-series capabilities, providing:
- **Automatic partitioning** by time (1-month chunks)
- **90% compression** for historical data
- **Continuous aggregates** for pre-computed analytics
- **Automatic data retention** policies
- **Optimized time-series queries**

## Setup

### 1. Initial Setup (After Database Creation)

```bash
# Apply TimescaleDB configuration
./scripts/apply-timescaledb.sh
```

This will:
- ✅ Enable TimescaleDB extension
- ✅ Convert `sales` table to hypertable
- ✅ Create continuous aggregates (hourly & daily)
- ✅ Set up compression policy (compress after 1 month)
- ✅ Set up retention policy (keep 3 years)
- ✅ Create optimized indexes
- ✅ Add helper functions

### 2. Verify Setup

```bash
# Check TimescaleDB health
npm run start:dev

# Then call the health endpoint
curl http://localhost:3000/api/health/timescaledb
```

## Features

### 1. Hypertables

The `sales` table is converted to a hypertable, which means:
- Data is automatically partitioned into 1-month chunks
- Queries are optimized for time-based operations
- Old chunks can be compressed or dropped automatically

```sql
-- Query sales for last 7 days (automatically uses correct chunks)
SELECT * FROM sales
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND organization_id = 'xxx'
ORDER BY created_at DESC;
```

### 2. Continuous Aggregates

Pre-computed views that update automatically:

#### Daily Sales Summary
```sql
SELECT * FROM daily_sales_summary
WHERE organization_id = 'xxx'
  AND branch_id = 'yyy'
  AND day >= '2024-11-01'
ORDER BY day DESC;
```

Returns:
- Total transactions
- Total sales
- Total tax
- Average transaction value
- Unique customers

#### Hourly Sales Summary
```sql
SELECT * FROM hourly_sales_summary
WHERE organization_id = 'xxx'
  AND branch_id = 'yyy'
  AND hour >= NOW() - INTERVAL '24 hours'
ORDER BY hour DESC;
```

### 3. Helper Functions

#### Get Sales Statistics
```typescript
// In your service
const stats = await this.timescaleDB.getSalesStats(
  organizationId,
  branchId,
  startDate,
  endDate
);

// Returns:
// {
//   total_sales: 150000,
//   total_transactions: 450,
//   avg_transaction: 333.33,
//   total_tax: 24000,
//   unique_customers: 120
// }
```

#### Get Top Products
```typescript
const topProducts = await this.timescaleDB.getTopProducts(
  organizationId,
  branchId,
  startDate,
  endDate,
  10 // limit
);

// Returns array of:
// {
//   product_id: 'xxx',
//   product_name: 'Samsung Galaxy A54',
//   total_quantity: 45,
//   total_sales: 1890000,
//   transaction_count: 45
// }
```

#### Get Sales Trend
```typescript
const trend = await this.timescaleDB.getSalesTrend(
  organizationId,
  branchId,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd
);

// Returns:
// {
//   current: { total_sales: 150000, ... },
//   previous: { total_sales: 120000, ... },
//   changes: {
//     sales: 25.0,        // 25% increase
//     transactions: 15.5,  // 15.5% increase
//     avgTransaction: 8.2, // 8.2% increase
//     customers: 10.0      // 10% increase
//   }
// }
```

### 4. Compression

Data older than 1 month is automatically compressed:
- **Compression ratio:** ~90% (10x smaller)
- **Query performance:** Slightly slower for compressed data
- **Storage savings:** Massive (TB → GB)

```typescript
// Check compression stats
const stats = await this.timescaleDB.getCompressionStats('sales');

// Returns:
// {
//   total_chunks: 12,
//   compressed_chunks: 10,
//   uncompressed_size: 5368709120,  // 5 GB
//   compressed_size: 536870912,      // 512 MB
//   compression_ratio: 90.0          // 90% savings
// }
```

### 5. Data Retention

Automatically drops data older than 3 years:
- Runs daily
- Deletes entire chunks (fast)
- Configurable per table

```sql
-- Change retention policy
SELECT remove_retention_policy('sales');
SELECT add_retention_policy('sales', INTERVAL '5 years');
```

## Usage Examples

### Example 1: Real-time Dashboard

```typescript
@Injectable()
export class DashboardService {
  constructor(private timescaleDB: TimescaleDBService) {}

  async getDashboardData(organizationId: string, branchId: string) {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Get today's stats
    const todayStats = await this.timescaleDB.getSalesStats(
      organizationId,
      branchId,
      today,
      now
    );

    // Get hourly breakdown for today
    const hourlyData = await this.timescaleDB.getHourlySalesSummary(
      organizationId,
      branchId,
      today,
      now
    );

    // Get trend vs yesterday
    const trend = await this.timescaleDB.getSalesTrend(
      organizationId,
      branchId,
      today,
      now,
      yesterday,
      today
    );

    // Get top products today
    const topProducts = await this.timescaleDB.getTopProducts(
      organizationId,
      branchId,
      today,
      now,
      5
    );

    return {
      stats: todayStats,
      hourlyBreakdown: hourlyData,
      trend: trend.changes,
      topProducts
    };
  }
}
```

### Example 2: Monthly Report

```typescript
async getMonthlyReport(organizationId: string, branchId: string, month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Use daily summary for fast aggregation
  const dailyData = await this.timescaleDB.getDailySalesSummary(
    organizationId,
    branchId,
    startOfMonth,
    endOfMonth
  );

  // Calculate monthly totals
  const monthlyTotal = dailyData.reduce((acc, day) => ({
    sales: acc.sales + Number(day.total_sales),
    transactions: acc.transactions + Number(day.total_transactions),
    tax: acc.tax + Number(day.total_tax),
    customers: Math.max(acc.customers, Number(day.unique_customers))
  }), { sales: 0, transactions: 0, tax: 0, customers: 0 });

  return {
    month: month.toISOString(),
    daily: dailyData,
    totals: monthlyTotal
  };
}
```

## Performance Tips

### 1. Use Time Ranges
Always include time ranges in queries for optimal performance:
```sql
-- Good ✓
SELECT * FROM sales
WHERE created_at >= '2024-11-01'
  AND created_at < '2024-12-01'
  AND organization_id = 'xxx';

-- Bad ✗ (scans all chunks)
SELECT * FROM sales
WHERE organization_id = 'xxx';
```

### 2. Use Continuous Aggregates
For reports, use pre-computed aggregates instead of raw data:
```sql
-- Good ✓ (instant)
SELECT * FROM daily_sales_summary
WHERE day >= '2024-11-01';

-- Bad ✗ (slow, scans millions of rows)
SELECT DATE(created_at), COUNT(*), SUM(total_amount)
FROM sales
WHERE created_at >= '2024-11-01'
GROUP BY DATE(created_at);
```

### 3. Partition by Organization/Branch
Queries are faster when filtering by organization and branch:
```sql
-- Good ✓
SELECT * FROM sales
WHERE organization_id = 'xxx'
  AND branch_id = 'yyy'
  AND created_at >= NOW() - INTERVAL '7 days';
```

## Monitoring

### Check Hypertable Status
```sql
SELECT * FROM timescaledb_information.hypertables;
```

### Check Chunk Information
```sql
SELECT
  chunk_name,
  range_start,
  range_end,
  total_bytes / 1024 / 1024 as size_mb,
  compressed_total_bytes IS NOT NULL as compressed
FROM timescaledb_information.chunks
WHERE hypertable_name = 'sales'
ORDER BY range_start DESC;
```

### Check Compression Jobs
```sql
SELECT * FROM timescaledb_information.jobs
WHERE proc_name = 'policy_compression';
```

### Check Continuous Aggregate Status
```sql
SELECT * FROM timescaledb_information.continuous_aggregates;
```

## Troubleshooting

### Continuous Aggregate Not Updating
```bash
# Manually refresh
psql $DATABASE_URL -c "CALL refresh_continuous_aggregate('daily_sales_summary', NULL, NULL);"
```

### Compression Not Working
```sql
-- Check compression policy
SELECT * FROM timescaledb_information.jobs
WHERE proc_name = 'policy_compression';

-- Manually compress a chunk
SELECT compress_chunk('_timescaledb_internal._hyper_1_1_chunk');
```

### Slow Queries
```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM sales
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND organization_id = 'xxx';

-- Should show "Append" with chunk exclusion
```

## Advanced Configuration

### Custom Retention Policy
```sql
-- Remove existing policy
SELECT remove_retention_policy('sales');

-- Add new policy (5 years)
SELECT add_retention_policy('sales', INTERVAL '5 years');
```

### Custom Compression Policy
```sql
-- Remove existing policy
SELECT remove_compression_policy('sales');

-- Add new policy (compress after 3 months)
SELECT add_compression_policy('sales', INTERVAL '3 months');
```

### Custom Continuous Aggregate Refresh
```sql
-- Remove existing policy
SELECT remove_continuous_aggregate_policy('daily_sales_summary');

-- Add new policy (refresh every 30 minutes)
SELECT add_continuous_aggregate_policy(
  'daily_sales_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '30 minutes'
);
```

## Resources

- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Best Practices](https://docs.timescale.com/timescaledb/latest/how-to-guides/hypertables/best-practices/)
- [Compression Guide](https://docs.timescale.com/timescaledb/latest/how-to-guides/compression/)
- [Continuous Aggregates](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/)
