import fastify, { FastifyInstance, RawServerDefault } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { DataSource } from 'typeorm'
import { config } from './config/env'
import logger from './utils/logger'
import { paymentRoutes } from './routes/payment.routes'
import { webhookRoutes } from './routes/webhook.routes'
import { paymentMethodRoutes } from './routes/payment-method.routes'
import { adminRoutes } from './routes/admin.routes'
import { paymentGatewayRoutes } from './routes/payment-gateway.routes'
import { PaymentService } from './services/payment.service'
import { PaymentGatewayService } from './services/payment-gateway.service'
import { StripeService } from './services/stripe.service'
import { RazorpayService } from './services/razorpay.service'
import { PaypalService } from './services/paypal.service'
import { Payment } from './entities/payment.entity'
import { PaymentMethod } from './entities/payment-method.entity'
import { PaymentGateway } from './entities/payment-gateway.entity'
import { TypeormPlugin } from './plugins/typeorm'
import { swaggerConfig, swaggerUiOptions } from './config/swagger'
import { authMiddleware } from './middleware/auth.guard'

// Extend FastifyInstance type
declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource
    paymentService: PaymentService
    paymentGatewayService: PaymentGatewayService
    stripeService: StripeService
    razorpayService: RazorpayService
    paypalService: PaypalService
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const server = fastify<RawServerDefault>({
    logger,
    trustProxy: true
  })

  try {
    // Register database plugin
    await server.register(TypeormPlugin)

    // Register security plugins
    await server.register(helmet)
    await server.register(cors, {
      origin: config.cors.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })

    // Rate limiting
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      allowList: ['127.0.0.1']
    })

    // API Documentation
    await server.register(fastifySwagger, swaggerConfig)
    await server.register(fastifySwaggerUi, swaggerUiOptions)

    // Add health check endpoint that doesn't require authentication
    server.get('/health', {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (_, reply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Register global auth middleware only for API routes, not for documentation or webhooks
    server.addHook('preHandler', (request, reply, done) => {
      // Skip auth middleware for:
      // 1. Swagger documentation routes
      // 2. Health check endpoint
      // 3. Webhook endpoints
      if (
        request.url.startsWith('/documentation') || 
        request.url === '/health' ||
        request.url.startsWith('/api/v1/stripe') ||
        request.url.startsWith('/api/v1/paypal') ||
        request.url.startsWith('/api/v1/razorpay')
      ) {
        done();
      } else {
        authMiddleware(request, reply, done);
      }
    });

    // Initialize services
    const stripeService = new StripeService(config.stripe.secretKey)
    const razorpayService = new RazorpayService(config.razorpay.key, config.razorpay.secret)
    const paypalService = new PaypalService(config.paypal.clientId, config.paypal.clientSecret)
    server.decorate('stripeService', stripeService)
    server.decorate('razorpayService', razorpayService)
    server.decorate('paypalService', paypalService)

    const paymentService = new PaymentService(
      server.db.getRepository(Payment),
      server.db.getRepository(PaymentMethod),
      stripeService,
      razorpayService,
      paypalService
    )
    server.decorate('paymentService', paymentService)

    const paymentGatewayService = new PaymentGatewayService(
      server.db.getRepository(PaymentGateway)
    )
    server.decorate('paymentGatewayService', paymentGatewayService)

    // Register routes
    await server.register(paymentRoutes, { prefix: '/api/v1' })
    await server.register(webhookRoutes, { prefix: '/api/v1' })
    await server.register(paymentMethodRoutes, { prefix: '/api/v1' })
    await server.register(adminRoutes, { prefix: '/api/v1' })
    await server.register(paymentGatewayRoutes, { prefix: '/api/v1' })

    // Global error handler
    server.setErrorHandler((error, request, reply) => {
      request.log.error(error)

      // Handle validation errors
      if (error.validation) {
        return reply.status(400).send({
          status: 'error',
          message: 'Validation failed',
          errors: error.validation
        })
      }

      // Handle not found errors
      if (error.statusCode === 404) {
        return reply.status(404).send({
          status: 'error',
          message: error.message
        })
      }

      // Handle unknown errors
      return reply.status(500).send({
        status: 'error',
        message: 'Internal Server Error'
      })
    })

    logger.info('Server built successfully')
    return server
  } catch (error) {
    logger.error(error, 'Failed to build server')
    throw error
  }
} 