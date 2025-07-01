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
          }, 'Stripe payment succeeded');
          break;

        case 'payment_intent.payment_failed':
          logger.error({
            event: event.type,
            paymentIntent: event.data.object
          }, 'Stripe payment failed');
          break;

        case 'charge.refunded':
          logger.info({
            event: event.type,
            charge: event.data.object
          }, 'Stripe payment refunded');
          break;

        default:
          logger.info({
            event: event.type
          }, 'Unhandled Stripe webhook event');
      }

      reply.send({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'Stripe webhook processing failed');
      reply.code(400).send({ message: 'Webhook processing failed' });
    }
  });

  fastify.post<{ Body: any }>('/paypal', {
    schema: {
      tags: ['webhooks'],
      description: 'PayPal webhook endpoint for payment event notifications',
      headers: {
        type: 'object',
        required: ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'],
        properties: {
          'paypal-auth-algo': { 
            type: 'string', 
            description: 'PayPal auth algorithm'
          },
          'paypal-cert-url': { 
            type: 'string', 
            description: 'PayPal certificate URL'
          },
          'paypal-transmission-id': { 
            type: 'string', 
            description: 'PayPal transmission ID'
          },
          'paypal-transmission-sig': { 
            type: 'string', 
            description: 'PayPal transmission signature'
          },
          'paypal-transmission-time': { 
            type: 'string', 
            description: 'PayPal transmission time'
          }
        }
      },
      body: {
        type: 'object',
        description: 'PayPal event object',
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
    const webhookId = config.paypal.webhookId;
    const webhookSignature = request.headers['paypal-transmission-sig'];

    if (!webhookSignature || Array.isArray(webhookSignature)) {
      reply.code(400).send({ message: 'Invalid PayPal signature' });
      return;
    }

    if (!request.rawBody) {
      reply.code(400).send({ message: 'No raw body found' });
      return;
    }

    try {
      const event = await paymentService.handlePaypalWebhook(
        request.rawBody,
        webhookId,
        webhookSignature
      );

      // Handle different event types
      switch (event.type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          logger.info({
            event: event.type,
            payment: event.data.object
          }, 'PayPal payment succeeded');
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          logger.error({
            event: event.type,
            payment: event.data.object
          }, 'PayPal payment failed');
          break;

        case 'PAYMENT.CAPTURE.REFUNDED':
          logger.info({
            event: event.type,
            payment: event.data.object
          }, 'PayPal payment refunded');
          break;

        default:
          logger.info({
            event: event.type
          }, 'Unhandled PayPal webhook event');
      }

      reply.send({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'PayPal webhook processing failed');
      reply.code(400).send({ message: 'Webhook processing failed' });
    }
  });

  fastify.post<{ Body: any }>('/razorpay', {
    schema: {
      tags: ['webhooks'],
      description: 'Razorpay webhook endpoint for payment event notifications',
      headers: {
        type: 'object',
        required: ['x-razorpay-signature'],
        properties: {
          'x-razorpay-signature': { 
            type: 'string', 
            description: 'Razorpay signature to verify webhook authenticity'
          }
        }
      },
      body: {
        type: 'object',
        description: 'Razorpay event object',
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
    const signature = request.headers['x-razorpay-signature'];

    if (!signature || Array.isArray(signature)) {
      reply.code(400).send({ message: 'Invalid Razorpay signature' });
      return;
    }

    if (!request.rawBody) {
      reply.code(400).send({ message: 'No raw body found' });
      return;
    }

    try {
      const event = await paymentService.handleRazorpayWebhook(
        request.rawBody,
        signature
      );

      // Handle different event types
      switch (event.type) {
        case 'payment.authorized':
          logger.info({
            event: event.type,
            payment: event.data.object
          }, 'Razorpay payment succeeded');
          break;

        case 'payment.failed':
          logger.error({
            event: event.type,
            payment: event.data.object
          }, 'Razorpay payment failed');
          break;

        case 'refund.created':
          logger.info({
            event: event.type,
            payment: event.data.object
          }, 'Razorpay payment refunded');
          break;

        default:
          logger.info({
            event: event.type
          }, 'Unhandled Razorpay webhook event');
      }

      reply.send({ received: true });
    } catch (error) {
      logger.error({ err: error }, 'Razorpay webhook processing failed');
      reply.code(400).send({ message: 'Webhook processing failed' });
    }
  });
} 