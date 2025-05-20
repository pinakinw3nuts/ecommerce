import { FastifyInstance, FastifyRequest } from 'fastify';
import { config } from '../config/env';
import logger from '../utils/logger';

interface WebhookRequest extends FastifyRequest {
  rawBody?: string;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  const paymentService = fastify.paymentService;

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
      (req as WebhookRequest).rawBody = body as string;
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  fastify.post<{ Body: any }>('/stripe', {
    schema: {
      tags: ['webhooks'],
      description: 'Stripe webhook endpoint for payment event notifications',
      headers: {
        type: 'object',
        required: ['stripe-signature'],
        properties: {
          'stripe-signature': { 
            type: 'string', 
            description: 'Stripe signature to verify webhook authenticity'
          }
        }
      },
      body: {
        type: 'object',
        description: 'Stripe event object',
        additionalProperties: true
      },
      response: {
        200: {
          description: 'Webhook processed successfully',
          type: 'object',
          properties: {
            received: { type: 'boolean' }
          }
        },
        400: {
          description: 'Invalid webhook payload or signature',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: WebhookRequest, reply) => {
    const signature = request.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      reply.code(400).send({ message: 'Invalid Stripe signature' });
      return;
    }

    if (!request.rawBody) {
      reply.code(400).send({ message: 'No raw body found' });
      return;
    }

    try {
      const event = await paymentService.handleStripeWebhook(
        request.rawBody,
        signature,
        config.stripe.webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          logger.info({
            event: event.type,
            paymentIntent: event.data.object
          }, 'Payment succeeded');
          break;

        case 'payment_intent.payment_failed':
          logger.error({
            event: event.type,
            paymentIntent: event.data.object
          }, 'Payment failed');
          break;

        case 'charge.refunded':
          logger.info({
            event: event.type,
            charge: event.data.object
          }, 'Payment refunded');
          break;

        default:
          logger.info({
            event: event.type
          }, 'Unhandled webhook event');
      }

      reply.send({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'Webhook processing failed');
      reply.code(400).send({ message: 'Webhook processing failed' });
    }
  });
} 