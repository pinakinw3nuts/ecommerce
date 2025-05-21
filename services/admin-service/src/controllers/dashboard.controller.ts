import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService, TimePeriod } from '../services/dashboard.service';
import logger from '../utils/logger';

/**
 * Interface for time period query parameter
 */
interface TimeRangeQuery {
  period?: TimePeriod;
}

/**
 * Interface for pagination query parameters
 */
interface PaginationQuery {
  limit?: number;
  page?: number;
}

/**
 * Interface for chart data query parameters
 */
interface ChartDataQuery extends TimeRangeQuery {
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Controller for dashboard statistics and analytics
 */
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Get basic statistics for the admin dashboard
   * @route GET /api/admin/stats
   */
  async getStats(request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) {
    try {
      const { period = TimePeriod.THIS_MONTH } = request.query;
      
      const stats = await this.dashboardService.getBasicStats(period);
      
      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(error, 'Error fetching dashboard stats');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    }
  }

  /**
   * Get detailed metrics for analytics
   * @route GET /api/admin/metrics
   */
  async getMetrics(request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) {
    try {
      const { period = TimePeriod.THIS_MONTH } = request.query;
      
      // Get basic stats
      const stats = await this.dashboardService.getBasicStats(period);
      
      // Get top selling products
      const topProducts = await this.dashboardService.getTopSellingProducts(5, period);
      
      return reply.status(200).send({
        success: true,
        data: {
          basicStats: stats,
          topProducts
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching detailed metrics');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch detailed metrics'
      });
    }
  }

  /**
   * Get sales data over time for charts
   * @route GET /api/admin/charts/sales
   */
  async getSalesChart(request: FastifyRequest<{ Querystring: ChartDataQuery }>, reply: FastifyReply) {
    try {
      const { 
        period = TimePeriod.THIS_MONTH,
        groupBy = 'day'
      } = request.query;
      
      const salesData = await this.dashboardService.getSalesOverTime(period, groupBy);
      
      return reply.status(200).send({
        success: true,
        data: {
          labels: salesData.map(item => item.date),
          datasets: [
            {
              label: 'Orders',
              data: salesData.map(item => item.orders)
            },
            {
              label: 'Revenue',
              data: salesData.map(item => item.revenue)
            }
          ]
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching sales chart data');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch sales chart data'
      });
    }
  }

  /**
   * Get user growth data for charts
   * @route GET /api/admin/charts/users
   */
  async getUsersChart(request: FastifyRequest<{ Querystring: ChartDataQuery }>, reply: FastifyReply) {
    try {
      const { 
        period = TimePeriod.THIS_MONTH,
        groupBy = 'day'
      } = request.query;
      
      const userData = await this.dashboardService.getUsersOverTime(period, groupBy);
      
      return reply.status(200).send({
        success: true,
        data: {
          labels: userData.map(item => item.date),
          datasets: [
            {
              label: 'New Users',
              data: userData.map(item => item.new_users)
            }
          ]
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching user growth chart data');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch user growth data'
      });
    }
  }

  /**
   * Get top products data for charts
   * @route GET /api/admin/charts/products
   */
  async getProductsChart(request: FastifyRequest<{ Querystring: TimeRangeQuery & PaginationQuery }>, reply: FastifyReply) {
    try {
      const { 
        period = TimePeriod.THIS_MONTH,
        limit = 10
      } = request.query;
      
      const topProducts = await this.dashboardService.getTopSellingProducts(limit, period);
      
      return reply.status(200).send({
        success: true,
        data: {
          labels: topProducts.map(product => product.name),
          datasets: [
            {
              label: 'Units Sold',
              data: topProducts.map(product => product.units_sold)
            },
            {
              label: 'Revenue',
              data: topProducts.map(product => product.revenue)
            }
          ],
          products: topProducts
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching product chart data');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch product chart data'
      });
    }
  }

  /**
   * Get revenue breakdown by various dimensions
   * @route GET /api/admin/charts/revenue-breakdown
   */
  async getRevenueBreakdown(request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) {
    try {
      // This is a placeholder - in a real implementation,
      // we would call specific service methods to get revenue breakdowns
      // by different dimensions like categories, payment methods, etc.
      
      return reply.status(200).send({
        success: true,
        data: {
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          datasets: [
            {
              label: 'Revenue by Category',
              data: [4500, 3200, 2100, 1800]
            }
          ]
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching revenue breakdown data');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch revenue breakdown data'
      });
    }
  }

  /**
   * Get all dashboard data in a single call (for initial dashboard load)
   * @route GET /api/admin/dashboard
   */
  async getDashboardData(request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) {
    try {
      const { period = TimePeriod.THIS_MONTH } = request.query;
      
      // Execute all queries in parallel for better performance
      const [
        stats,
        salesData,
        userData,
        topProducts
      ] = await Promise.all([
        this.dashboardService.getBasicStats(period),
        this.dashboardService.getSalesOverTime(period, 'day'),
        this.dashboardService.getUsersOverTime(period, 'day'),
        this.dashboardService.getTopSellingProducts(5, period)
      ]);
      
      return reply.status(200).send({
        success: true,
        data: {
          stats,
          charts: {
            sales: {
              labels: salesData.map(item => item.date),
              datasets: [
                {
                  label: 'Orders',
                  data: salesData.map(item => item.orders)
                },
                {
                  label: 'Revenue',
                  data: salesData.map(item => item.revenue)
                }
              ]
            },
            users: {
              labels: userData.map(item => item.date),
              datasets: [
                {
                  label: 'New Users',
                  data: userData.map(item => item.new_users)
                }
              ]
            },
            products: {
              labels: topProducts.map(product => product.name),
              datasets: [
                {
                  label: 'Units Sold',
                  data: topProducts.map(product => product.units_sold)
                }
              ]
            }
          },
          topProducts
        }
      });
    } catch (error) {
      logger.error(error, 'Error fetching dashboard data');
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  }
} 