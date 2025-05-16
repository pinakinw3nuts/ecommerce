import { FastifyInstance } from 'fastify';
import { HealthController } from '@controllers/health.controller';
import { DataSource } from 'typeorm';

export async function healthRoutes(
  fastify: FastifyInstance,
  dataSource: DataSource
) {
  const healthController = new HealthController(dataSource);

  fastify.route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      summary: 'Check service health',
      description: 'Returns the health status of the service and its dependencies',
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                    latency: { type: 'number', nullable: true },
                  },
                },
                server: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy'] },
                    uptime: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        503: {
          description: 'Service is unhealthy',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: healthController.check.bind(healthController),
  });
} 