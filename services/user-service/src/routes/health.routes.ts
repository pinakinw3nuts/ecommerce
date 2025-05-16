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
    handler: async () => ({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  })

  // Kubernetes readiness probe - check if service can handle requests
  app.get('/health/readiness', {
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