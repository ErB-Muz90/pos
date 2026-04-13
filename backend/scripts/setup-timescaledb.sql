-- TimescaleDB Hypertable Setup
-- This script converts regular PostgreSQL tables to TimescaleDB hypertables
-- for efficient time-series data storage and querying

-- Note: Run this AFTER the initial Prisma migration creates the tables

\echo 'Setting up TimescaleDB hypertables...'

-- 1. Convert sales table to hypertable (partitioned by created_at)
-- This enables efficient time-based queries and automatic data retention
SELECT create_hypertable(
    'sales',
    'created_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

\echo '✓ Sales table converted to hypertable'

-- 2. Create continuous aggregate for daily sales summary
-- This pre-computes daily aggregates for faster reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', created_at) AS day,
    organization_id,
    branch_id,
    COUNT(*) AS total_transactions,
    SUM(total_amount) AS total_sales,
    SUM(tax_amount) AS total_tax,
    AVG(total_amount) AS avg_transaction_value,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM sales
WHERE status = 'completed'
GROUP BY day, organization_id, branch_id;

\echo '✓ Daily sales summary view created'

-- 3. Add refresh policy for continuous aggregate (refresh every hour)
SELECT add_continuous_aggregate_policy(
    'daily_sales_summary',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

\echo '✓ Refresh policy added for daily sales summary'

-- 4. Create retention policy for sales data (keep 3 years)
-- Automatically drops old data chunks
SELECT add_retention_policy(
    'sales',
    INTERVAL '3 years',
    if_not_exists => TRUE
);

\echo '✓ Retention policy added for sales (3 years)'

-- 5. Create compression policy for sales data (compress after 1 month)
-- Reduces storage by ~90% for old data
ALTER TABLE sales SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'organization_id, branch_id',
    timescaledb.compress_orderby = 'created_at DESC'
);

SELECT add_compression_policy(
    'sales',
    INTERVAL '1 month',
    if_not_exists => TRUE
);

\echo '✓ Compression policy added for sales (compress after 1 month)'

-- 6. Create indexes for common time-series queries
CREATE INDEX IF NOT EXISTS idx_sales_time_org_branch 
ON sales (created_at DESC, organization_id, branch_id)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_sales_time_customer 
ON sales (created_at DESC, customer_id)
WHERE customer_id IS NOT NULL;

\echo '✓ Time-series indexes created'

-- 7. Create hourly sales summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_sales_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', created_at) AS hour,
    organization_id,
    branch_id,
    COUNT(*) AS total_transactions,
    SUM(total_amount) AS total_sales,
    SUM(tax_amount) AS total_tax
FROM sales
WHERE status = 'completed'
GROUP BY hour, organization_id, branch_id;

\echo '✓ Hourly sales summary view created'

-- 8. Add refresh policy for hourly summary (refresh every 15 minutes)
SELECT add_continuous_aggregate_policy(
    'hourly_sales_summary',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

\echo '✓ Refresh policy added for hourly sales summary'

-- 9. Create function to get sales statistics for a time range
CREATE OR REPLACE FUNCTION get_sales_stats(
    p_org_id UUID,
    p_branch_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_sales DECIMAL,
    total_transactions BIGINT,
    avg_transaction DECIMAL,
    total_tax DECIMAL,
    unique_customers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(s.total_amount), 0)::DECIMAL AS total_sales,
        COUNT(*)::BIGINT AS total_transactions,
        COALESCE(AVG(s.total_amount), 0)::DECIMAL AS avg_transaction,
        COALESCE(SUM(s.tax_amount), 0)::DECIMAL AS total_tax,
        COUNT(DISTINCT s.customer_id)::BIGINT AS unique_customers
    FROM sales s
    WHERE s.organization_id = p_org_id
        AND s.branch_id = p_branch_id
        AND s.created_at >= p_start_date
        AND s.created_at < p_end_date
        AND s.status = 'completed';
END;
$$ LANGUAGE plpgsql;

\echo '✓ Sales statistics function created'

-- 10. Create function to get top selling products for a time range
CREATE OR REPLACE FUNCTION get_top_products(
    p_org_id UUID,
    p_branch_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    total_quantity DECIMAL,
    total_sales DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.product_id,
        si.product_name,
        SUM(si.quantity)::DECIMAL AS total_quantity,
        SUM(si.total_amount)::DECIMAL AS total_sales,
        COUNT(DISTINCT s.id)::BIGINT AS transaction_count
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.organization_id = p_org_id
        AND s.branch_id = p_branch_id
        AND s.created_at >= p_start_date
        AND s.created_at < p_end_date
        AND s.status = 'completed'
    GROUP BY si.product_id, si.product_name
    ORDER BY total_sales DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

\echo '✓ Top products function created'

\echo ''
\echo '✨ TimescaleDB setup complete!'
\echo ''
\echo 'Benefits:'
\echo '  - Automatic time-based partitioning (1 month chunks)'
\echo '  - 90% compression for data older than 1 month'
\echo '  - Automatic data retention (3 years)'
\echo '  - Pre-computed hourly and daily aggregates'
\echo '  - Optimized indexes for time-series queries'
\echo ''
