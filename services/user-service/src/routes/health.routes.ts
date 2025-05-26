import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Type } from '@fastify/type-provider-typebox'

const healthResponseSchema = Type.Object({
  status: Type.Enum({ ok: 'ok', error: 'error' }),
  timestamp: Type.String(),
  uptime: Type.Number(),
  version: Type.String(),
  database: Type.Object({
    status: Type.Enum({ ok: 'ok', error: 'error' }),
    latency: Type.Number()
  })
})

type HealthResponse = typeof healthResponseSchema

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check',
      description: 'Check the health status of the service and its dependencies',
      response: {
        200: healthResponseSchema
      }
    },
    handler: async (request: FastifyRequest) => {
      const startTime = process.hrtime()
      
      // Check database connection
      let dbStatus: 'ok' | 'error' = 'error'
      let dbLatency = 0

      try {
        await app.db.query('SELECT 1')
        dbStatus = 'ok'
        const [seconds, nanoseconds] = process.hrtime(startTime)
        dbLatency = seconds * 1000 + nanoseconds / 1000000 // Convert to milliseconds
      } catch (error) {
        request.log.error('Database health check failed:', error)
      }

      const response = {
        status: dbStatus === 'ok' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        database: {
          status: dbStatus,
          latency: Math.round(dbLatency)
        }
      }

      return response
    }
  })

  // Kubernetes liveness probe - simple check if service is running
  app.get('/health/liveness', {
    schema: {
      tags: ['health'],
      summary: 'Liveness probe',
      description: 'Kubernetes liveness probe endpoint to check if service is running',
      response: {
        200: Type.Object({
          status: Type.String({ enum: ['ok'] }),
          timestamp: Type.String({ format: 'date-time' })
        })
      }
    },
    handler: async () => ({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  })

  // Kubernetes readiness probe - check if service can handle requests
  app.get('/health/readiness', {
    schema: {
      tags: ['health'],
      summary: 'Readiness probe',
      description: 'Kubernetes readiness probe endpoint to check if service can handle requests',
      response: {
        200: Type.Object({
          status: Type.String({ enum: ['ok'] }),
          timestamp: Type.String({ format: 'date-time' })
        }),
        503: Type.Object({
          status: Type.String({ enum: ['error'] }),
          timestamp: Type.String({ format: 'date-time' })
        })
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await app.db.query('SELECT 1')
        return {
          status: 'ok',
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        request.log.error('Readiness check failed:', error)
        return reply.status(503).send({
          status: 'error',
          timestamp: new Date().toISOString()
        })
      }
    }
  })
} 