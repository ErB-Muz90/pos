import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * TimescaleDB Service
 * Provides helper methods for TimescaleDB-specific operations
 */
@Injectable()
export class TimescaleDBService {
  private readonly logger = new Logger(TimescaleDBService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get sales statistics for a time range
   */
  async getSalesStats(
    organizationId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const result = await this.prisma.$queryRaw<
      Array<{
        total_sales: number;
        total_transactions: bigint;
        avg_transaction: number;
        total_tax: number;
        unique_customers: bigint;
      }>
    >`
      SELECT * FROM get_sales_stats(
        ${organizationId}::UUID,
        ${branchId}::UUID,
        ${startDate}::TIMESTAMPTZ,
        ${endDate}::TIMESTAMPTZ
      )
    `;

    return result[0] || {
      total_sales: 0,
      total_transactions: 0n,
      avg_transaction: 0,
      total_tax: 0,
      unique_customers: 0n,
    };
  }

  /**
   * Get top selling products for a time range
   */
  async getTopProducts(
    organizationId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ) {
    return await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        product_name: string;
        total_quantity: number;
        total_sales: number;
        transaction_count: bigint;
      }>
    >`
      SELECT * FROM get_top_products(
        ${organizationId}::UUID,
        ${branchId}::UUID,
        ${startDate}::TIMESTAMPTZ,
        ${endDate}::TIMESTAMPTZ,
        ${limit}
      )
    `;
  }

  /**
   * Get daily sales summary from continuous aggregate
   */
  async getDailySalesSummary(
    organizationId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await this.prisma.$queryRaw<
      Array<{
        day: Date;
        organization_id: string;
        branch_id: string;
        total_transactions: bigint;
        total_sales: number;
        total_tax: number;
        avg_transaction_value: number;
        unique_customers: bigint;
      }>
    >`
      SELECT *
      FROM daily_sales_summary
      WHERE organization_id = ${organizationId}::UUID
        AND branch_id = ${branchId}::UUID
        AND day >= ${startDate}::TIMESTAMPTZ
        AND day < ${endDate}::TIMESTAMPTZ
      ORDER BY day DESC
    `;
  }

  /**
   * Get hourly sales summary from continuous aggregate
   */
  async getHourlySalesSummary(
    organizationId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return await this.prisma.$queryRaw<
      Array<{
        hour: Date;
        organization_id: string;
        branch_id: string;
        total_transactions: bigint;
        total_sales: number;
        total_tax: number;
      }>
    >`
      SELECT *
      FROM hourly_sales_summary
      WHERE organization_id = ${organizationId}::UUID
        AND branch_id = ${branchId}::UUID
        AND hour >= ${startDate}::TIMESTAMPTZ
        AND hour < ${endDate}::TIMESTAMPTZ
      ORDER BY hour DESC
    `;
  }

  /**
   * Get sales trend (comparing periods)
   */
  async getSalesTrend(
    organizationId: string,
    branchId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ) {
    const [currentStats, previousStats] = await Promise.all([
      this.getSalesStats(organizationId, branchId, currentStart, currentEnd),
      this.getSalesStats(organizationId, branchId, previousStart, previousEnd),
    ]);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: currentStats,
      previous: previousStats,
      changes: {
        sales: calculateChange(
          Number(currentStats.total_sales),
          Number(previousStats.total_sales),
        ),
        transactions: calculateChange(
          Number(currentStats.total_transactions),
          Number(previousStats.total_transactions),
        ),
        avgTransaction: calculateChange(
          Number(currentStats.avg_transaction),
          Number(previousStats.avg_transaction),
        ),
        customers: calculateChange(
          Number(currentStats.unique_customers),
          Number(previousStats.unique_customers),
        ),
      },
    };
  }

  /**
   * Get chunk information for hypertable
   */
  async getChunkInfo(tableName: string = 'sales') {
    return await this.prisma.$queryRaw<
      Array<{
        chunk_name: string;
        range_start: Date;
        range_end: Date;
        size_bytes: bigint;
        compressed: boolean;
      }>
    >`
      SELECT
        chunk_schema || '.' || chunk_name as chunk_name,
        range_start,
        range_end,
        total_bytes as size_bytes,
        compressed_total_bytes IS NOT NULL as compressed
      FROM timescaledb_information.chunks
      WHERE hypertable_name = ${tableName}
      ORDER BY range_start DESC
    `;
  }

  /**
   * Manually refresh continuous aggregate
   */
  async refreshContinuousAggregate(viewName: string) {
    try {
      await this.prisma.$executeRaw`
        CALL refresh_continuous_aggregate(${viewName}::REGCLASS, NULL, NULL)
      `;
      this.logger.log(`Refreshed continuous aggregate: ${viewName}`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh continuous aggregate: ${viewName}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get compression statistics
   */
  async getCompressionStats(tableName: string = 'sales') {
    return await this.prisma.$queryRaw<
      Array<{
        total_chunks: bigint;
        compressed_chunks: bigint;
        uncompressed_size: bigint;
        compressed_size: bigint;
        compression_ratio: number;
      }>
    >`
      SELECT
        COUNT(*) as total_chunks,
        COUNT(*) FILTER (WHERE compressed_total_bytes IS NOT NULL) as compressed_chunks,
        SUM(total_bytes) as uncompressed_size,
        SUM(COALESCE(compressed_total_bytes, 0)) as compressed_size,
        CASE
          WHEN SUM(compressed_total_bytes) > 0
          THEN ROUND((1 - SUM(compressed_total_bytes)::NUMERIC / SUM(total_bytes)::NUMERIC) * 100, 2)
          ELSE 0
        END as compression_ratio
      FROM timescaledb_information.chunks
      WHERE hypertable_name = ${tableName}
    `;
  }

  /**
   * Check TimescaleDB health
   */
  async checkHealth() {
    try {
      // Check if TimescaleDB extension is installed
      const extensionCheck = await this.prisma.$queryRaw<
        Array<{ extname: string; extversion: string }>
      >`
        SELECT extname, extversion
        FROM pg_extension
        WHERE extname = 'timescaledb'
      `;

      if (extensionCheck.length === 0) {
        return {
          healthy: false,
          message: 'TimescaleDB extension not installed',
        };
      }

      // Check if sales hypertable exists
      const hypertableCheck = await this.prisma.$queryRaw<
        Array<{ hypertable_name: string }>
      >`
        SELECT hypertable_name
        FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'sales'
      `;

      if (hypertableCheck.length === 0) {
        return {
          healthy: false,
          message: 'Sales hypertable not configured',
          version: extensionCheck[0].extversion,
        };
      }

      return {
        healthy: true,
        message: 'TimescaleDB is properly configured',
        version: extensionCheck[0].extversion,
        hypertables: hypertableCheck.map((h) => h.hypertable_name),
      };
    } catch (error) {
      this.logger.error('TimescaleDB health check failed', error);
      return {
        healthy: false,
        message: 'Health check failed',
        error: error.message,
      };
    }
  }
}
