import { FastifyInstance } from 'fastify';
import { PaymentMethodController } from '../controllers/payment-method.controller';
import { PaymentMethodType, PaymentMethodStatus } from '../entities/payment-method.entity';

const paymentMethodBodySchema = {
  type: 'object',
  required: ['type', 'provider', 'card'],
  properties: {
    type: { type: 'string', enum: Object.values(PaymentMethodType) },
    provider: { type: 'string' },
    card: {
      type: 'object',
      required: ['number', 'exp_month', 'exp_year', 'cvc'],
      properties: {
        number: { type: 'string' },
        exp_month: { type: 'number' },
        exp_year: { type: 'number' },
        cvc: { type: 'string' }
      }
    },
    isDefault: { type: 'boolean' },
    metadata: { type: 'object' }
  }
};

const paymentMethodResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    type: { type: 'string', enum: Object.values(PaymentMethodType) },
    provider: { type: 'string' },
    providerMethodId: { type: 'string' },
    last4: { type: 'string' },
    expiryMonth: { type: 'string' },
    expiryYear: { type: 'string' },
    brand: { type: 'string' },
    status: { type: 'string', enum: Object.values(PaymentMethodStatus) },
    isDefault: { type: 'boolean' },
    metadata: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const updateBodySchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: Object.values(PaymentMethodStatus) },
    isDefault: { type: 'boolean' },
    metadata: { type: 'object' }
  }
};

export async function paymentMethodRoutes(fastify: FastifyInstance) {
  const controller = new PaymentMethodController(fastify.paymentService);

  fastify.post('/payment-methods', {
    schema: {
      tags: ['payment-methods'],
      description: 'Add a new payment method for the authenticated user',
      body: paymentMethodBodySchema,
      response: {
        201: {
          description: 'Payment method created',
          ...paymentMethodResponseSchema
        }
      }
    }
  }, controller.create.bind(controller));

  fastify.get('/payment-methods', {
    schema: {
      tags: ['payment-methods'],
      description: 'List all payment methods for the authenticated user',
      response: {
        200: {
          type: 'array',
          items: paymentMethodResponseSchema
        }
      }
    }
  }, controller.list.bind(controller));

  fastify.get('/payment-methods/:id', {
    schema: {
      tags: ['payment-methods'],
      description: 'Get a payment method by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: paymentMethodResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.get.bind(controller));

  fastify.put('/payment-methods/:id', {
    schema: {
      tags: ['payment-methods'],
      description: 'Update a payment method',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: updateBodySchema,
      response: {
        200: paymentMethodResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.update.bind(controller));

  fastify.delete('/payment-methods/:id', {
    schema: {
      tags: ['payment-methods'],
      description: 'Delete a payment method',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        204: {
          description: 'Payment method deleted',
          type: 'null'
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.delete.bind(controller));
} 