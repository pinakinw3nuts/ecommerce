import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller';
import { authGuard } from '../middlewares/authGuard';
import { TimeRangeQuery, ChartDataQuery } from '../types/dashboard';

/**
 * Dashboard routes for admin service
 * Provides analytics, statistics, and chart data for the admin dashboard
 * All routes are protected with authentication and admin role checks
 */
export default async function dashboardRoutes(
  fastify: FastifyInstance,
  opts: { prefix: string }
): Promise<void> {
  // Create controller instance
  const dashboardController = new DashboardController(
    fastify.diContainer.resolve('dashboardService')
  );

  // Basic statistics route
  fastify.get<{ Querystring: TimeRangeQuery }>(
    '/stats',
    {
      onRequest: [authGuard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'all_time'], default: 'this_month' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    dashboardController.getStats.bind(dashboardController)
  );

  // Detailed metrics route
  fastify.get<{ Querystring: TimeRangeQuery }>(
    '/metrics',
    {
      onRequest: [authGuard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'all_time'], default: 'this_month' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    dashboardController.getMetrics.bind(dashboardController)
  );

  // Complete dashboard data route (for initial dashboard load)
  fastify.get<{ Querystring: TimeRangeQuery }>(
    '/dashboard',
    {
      onRequest: [authGuard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'all_time'], default: 'this_month' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { 
                type: 'object',
                properties: {
                  stats: { type: 'object' },
                  charts: { type: 'object' },
                  topProducts: { type: 'array' }
                }
              }
            }
          }
        }
      }
    },
    dashboardController.getDashboardData.bind(dashboardController)
  );

  // Chart data routes
  const chartRoutes = [
    {
      path: '/charts/sales',
      handler: dashboardController.getSalesChart.bind(dashboardController)
    },
    {
      path: '/charts/users',
      handler: dashboardController.getUsersChart.bind(dashboardController)
    },
    {
      path: '/charts/products',
      handler: dashboardController.getProductsChart.bind(dashboardController)
    },
    {
      path: '/charts/revenue-breakdown',
      handler: dashboardController.getRevenueBreakdown.bind(dashboardController)
    }
  ];

  // Register all chart routes with the same middleware and similar schema patterns
  chartRoutes.forEach(({ path, handler }) => {
    fastify.get<{ Querystring: ChartDataQuery }>(
      path,
      {
        onRequest: [authGuard],
        schema: {
          querystring: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'all_time'], default: 'this_month' },
              groupBy: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' },
              limit: { type: 'number', default: 10 }
            }
          },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { 
                  type: 'object',
                  properties: {
                    labels: { type: 'array', items: { type: 'string' } },
                    datasets: { type: 'array' }
                  }
                }
              }
            }
          }
        }
      },
      handler
    );
  });
} 