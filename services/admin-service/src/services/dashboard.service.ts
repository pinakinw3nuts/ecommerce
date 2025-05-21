import { DataSource, EntityManager } from 'typeorm';
import logger from '../utils/logger';
import { formatCurrency, formatLargeNumber } from '../utils/format';

/**
 * Time period options for dashboard analytics
 */
export enum TimePeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  ALL_TIME = 'all_time'
}

/**
 * Interface for basic dashboard stats
 */
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  formattedRevenue: string;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  formattedAverageOrderValue: string;
  pendingOrders: number;
}

/**
 * Interface for sales data over time
 */
export interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

/**
 * Service for dashboard analytics and statistics
 */
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  /**
   * Get basic statistics for the dashboard
   */
  async getBasicStats(period: TimePeriod = TimePeriod.THIS_MONTH): Promise<DashboardStats> {
    try {
      const timeFilter = this.getTimeFilter(period);
      
      // Use a single transaction for all queries to ensure consistent results
      return await this.dataSource.transaction(async (manager: EntityManager) => {
        // Get orders data
        const ordersData = await this.getOrdersData(manager, timeFilter);
        
        // Get users count
        const totalUsers = await this.getUsersCount(manager, timeFilter);
        
        // Get products count
        const totalProducts = await this.getProductsCount(manager);
        
        // Calculate average order value
        const averageOrderValue = ordersData.totalOrders > 0 
          ? ordersData.totalRevenue / ordersData.totalOrders
          : 0;
          
        // Format revenue
        const formattedRevenue = formatCurrency(ordersData.totalRevenue);
        const formattedAverageOrderValue = formatCurrency(averageOrderValue);
        
        return {
          totalOrders: ordersData.totalOrders,
          totalRevenue: ordersData.totalRevenue,
          formattedRevenue,
          totalUsers,
          totalProducts,
          averageOrderValue,
          formattedAverageOrderValue,
          pendingOrders: ordersData.pendingOrders
        };
      });
    } catch (error) {
      logger.error(error, 'Error fetching dashboard stats');
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get sales data over time (daily, weekly, monthly)
   */
  async getSalesOverTime(
    period: TimePeriod = TimePeriod.THIS_MONTH,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<SalesData[]> {
    try {
      const timeFilter = this.getTimeFilter(period);
      
      // Format date based on grouping
      let dateFormat: string;
      let dateGrouping: string;
      
      switch (groupBy) {
        case 'week':
          dateFormat = 'YYYY-WW';
          dateGrouping = "TO_CHAR(\"createdAt\", 'YYYY-WW')";
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          dateGrouping = "TO_CHAR(\"createdAt\", 'YYYY-MM')";
          break;
        case 'day':
        default:
          dateFormat = 'YYYY-MM-DD';
          dateGrouping = "TO_CHAR(\"createdAt\", 'YYYY-MM-DD')";
          break;
      }
      
      const query = `
        SELECT 
          ${dateGrouping} as date,
          COUNT(id) as orders,
          COALESCE(SUM("totalAmount"), 0) as revenue
        FROM orders
        WHERE ${timeFilter.replace(/o\./g, '')}
        GROUP BY date
        ORDER BY date
      `;
      
      const result = await this.dataSource.manager.query(query);
      return result;
    } catch (error) {
      logger.error(error, 'Error fetching sales over time');
      throw new Error('Failed to fetch sales data');
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10, period: TimePeriod = TimePeriod.THIS_MONTH): Promise<any[]> {
    try {
      const timeFilter = this.getTimeFilter(period);
      
      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          COALESCE(SUM(oi.quantity), 0) as units_sold,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi."productId"
        LEFT JOIN orders o ON oi."orderId" = o.id
        WHERE ${timeFilter.replace(/"createdAt"/g, 'o."createdAt"')}
        GROUP BY p.id, p.name, p.price
        ORDER BY units_sold DESC
        LIMIT $1
      `;
      
      return await this.dataSource.manager.query(query, [limit]);
    } catch (error) {
      logger.error(error, 'Error fetching top selling products');
      throw new Error('Failed to fetch top products');
    }
  }

  /**
   * Get new users over time
   */
  async getUsersOverTime(
    period: TimePeriod = TimePeriod.THIS_MONTH,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    try {
      const timeFilter = this.getTimeFilter(period, 'created_at');
      
      // Format date based on grouping
      let dateGrouping: string;
      
      switch (groupBy) {
        case 'week':
          dateGrouping = "TO_CHAR(created_at, 'YYYY-WW')";
          break;
        case 'month':
          dateGrouping = "TO_CHAR(created_at, 'YYYY-MM')";
          break;
        case 'day':
        default:
          dateGrouping = "TO_CHAR(created_at, 'YYYY-MM-DD')";
          break;
      }
      
      const query = `
        SELECT 
          ${dateGrouping} as date,
          COUNT(id) as new_users
        FROM users
        WHERE ${timeFilter}
        GROUP BY date
        ORDER BY date
      `;
      
      return await this.dataSource.manager.query(query);
    } catch (error) {
      logger.error(error, 'Error fetching users over time');
      throw new Error('Failed to fetch user growth data');
    }
  }

  // Private helper methods

  /**
   * Get orders data (total, revenue, pending)
   */
  private async getOrdersData(manager: EntityManager, timeFilter: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
  }> {
    const ordersQuery = `
      SELECT 
        COUNT(id) as total_orders,
        COALESCE(SUM("totalAmount"), 0) as total_revenue,
        0 as pending_orders
      FROM orders
      WHERE ${timeFilter.replace(/o\./g, '')}
    `;
    
    const [result] = await manager.query(ordersQuery);
    
    return {
      totalOrders: parseInt(result.total_orders || '0', 10),
      totalRevenue: parseFloat(result.total_revenue || '0'),
      pendingOrders: parseInt(result.pending_orders || '0', 10)
    };
  }

  /**
   * Get total users count
   */
  private async getUsersCount(manager: EntityManager, timeFilter: string): Promise<number> {
    const usersQuery = `
      SELECT COUNT(id) as total_users
      FROM users
      WHERE ${timeFilter.replace(/o\./g, '').replace(/"createdAt"/g, 'created_at')}
    `;
    
    const [result] = await manager.query(usersQuery);
    return parseInt(result.total_users || '0', 10);
  }

  /**
   * Get total products count
   */
  private async getProductsCount(manager: EntityManager): Promise<number> {
    const productsQuery = `
      SELECT COUNT(id) as total_products
      FROM product
      WHERE "isPublished" = true
    `;
    
    const [result] = await manager.query(productsQuery);
    return parseInt(result.total_products || '0', 10);
  }

  /**
   * Generate SQL time filter based on period
   */
  private getTimeFilter(period: TimePeriod, dateField: string = '"createdAt"'): string {
    const now = new Date();
    
    switch (period) {
      case TimePeriod.TODAY:
        return `DATE(${dateField}) = CURRENT_DATE`;
        
      case TimePeriod.YESTERDAY:
        return `DATE(${dateField}) = CURRENT_DATE - INTERVAL '1 day'`;
        
      case TimePeriod.THIS_WEEK:
        return `DATE_TRUNC('week', ${dateField}) = DATE_TRUNC('week', CURRENT_DATE)`;
        
      case TimePeriod.LAST_WEEK:
        return `DATE_TRUNC('week', ${dateField}) = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')`;
        
      case TimePeriod.THIS_MONTH:
        return `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`;
        
      case TimePeriod.LAST_MONTH:
        return `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
        
      case TimePeriod.THIS_YEAR:
        return `DATE_TRUNC('year', ${dateField}) = DATE_TRUNC('year', CURRENT_DATE)`;
        
      case TimePeriod.ALL_TIME:
        return `${dateField} IS NOT NULL`;
        
      default:
        return `DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`;
    }
  }
} 