import { FastifyInstance } from 'fastify';
import { PaymentGatewayController } from '../controllers/payment-gateway.controller';
import { PaymentGatewayType } from '../entities/payment-gateway.entity';

export async function paymentGatewayRoutes(fastify: FastifyInstance) {
  const controller = new PaymentGatewayController(fastify.paymentGatewayService);

  // GET /payment-gateways - List all payment gateways
  fastify.get('/payment-gateways', {
    schema: {
      tags: ['payment-gateways'],
      description: 'List all payment gateways',
      querystring: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          type: { type: 'string', enum: Object.values(PaymentGatewayType) },
          supportRefunds: { type: 'boolean' },
          supportSubscriptions: { type: 'boolean' },
          country: { type: 'string' },
          currency: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: Object.values(PaymentGatewayType) },
              enabled: { type: 'boolean' },
              displayOrder: { type: 'number' },
              iconUrl: { type: 'string' }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.getAllGateways.bind(controller));

  // GET /payment-gateways/:code - Get a payment gateway by code
  fastify.get('/payment-gateways/:code', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Get a payment gateway by code',
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: Object.values(PaymentGatewayType) },
            enabled: { type: 'boolean' },
            displayOrder: { type: 'number' },
            iconUrl: { type: 'string' },
            redirectUrl: { type: 'string' },
            webhookUrl: { type: 'string' },
            supportsRefunds: { type: 'boolean' },
            supportsSubscriptions: { type: 'boolean' },
            supportsSavedCards: { type: 'boolean' },
            minAmount: { type: 'number' },
            maxAmount: { type: 'number' },
            transactionFeePercent: { type: 'number' },
            transactionFeeFixed: { type: 'number' },
            supportedCountries: { type: 'array', items: { type: 'string' } },
            excludedCountries: { type: 'array', items: { type: 'string' } },
            supportedCurrencies: { type: 'array', items: { type: 'string' } },
            defaultOrderStatus: { type: 'string' },
            paymentInstructions: { type: 'string' },
            checkoutFields: { type: 'array', items: { type: 'object' } },
            settings: { type: 'object' },
            metadata: { type: 'object' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.getGateway.bind(controller));

  // POST /payment-gateways - Create a new payment gateway
  fastify.post('/payment-gateways', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Create a new payment gateway',
      body: {
        type: 'object',
        required: ['code', 'name', 'type'],
        properties: {
          code: { type: 'string', minLength: 2, maxLength: 50 },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string' },
          type: { type: 'string', enum: Object.values(PaymentGatewayType) },
          enabled: { type: 'boolean' },
          displayOrder: { type: 'number' },
          iconUrl: { type: 'string' },
          redirectUrl: { type: 'string' },
          webhookUrl: { type: 'string' },
          supportsRefunds: { type: 'boolean' },
          supportsSubscriptions: { type: 'boolean' },
          supportsSavedCards: { type: 'boolean' },
          minAmount: { type: 'number' },
          maxAmount: { type: 'number' },
          transactionFeePercent: { type: 'number' },
          transactionFeeFixed: { type: 'number' },
          supportedCountries: { type: 'array', items: { type: 'string' } },
          excludedCountries: { type: 'array', items: { type: 'string' } },
          supportedCurrencies: { type: 'array', items: { type: 'string' } },
          defaultOrderStatus: { type: 'string' },
          paymentInstructions: { type: 'string' },
          checkoutFields: { type: 'array', items: { type: 'object' } },
          apiCredentials: { type: 'object' },
          settings: { type: 'object' },
          metadata: { type: 'object' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.createGateway.bind(controller));

  // PUT /payment-gateways/:code - Update a payment gateway
  fastify.put('/payment-gateways/:code', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Update a payment gateway',
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string' },
          type: { type: 'string', enum: Object.values(PaymentGatewayType) },
          enabled: { type: 'boolean' },
          displayOrder: { type: 'number' },
          iconUrl: { type: 'string' },
          redirectUrl: { type: 'string' },
          webhookUrl: { type: 'string' },
          supportsRefunds: { type: 'boolean' },
          supportsSubscriptions: { type: 'boolean' },
          supportsSavedCards: { type: 'boolean' },
          minAmount: { type: 'number' },
          maxAmount: { type: 'number' },
          transactionFeePercent: { type: 'number' },
          transactionFeeFixed: { type: 'number' },
          supportedCountries: { type: 'array', items: { type: 'string' } },
          excludedCountries: { type: 'array', items: { type: 'string' } },
          supportedCurrencies: { type: 'array', items: { type: 'string' } },
          defaultOrderStatus: { type: 'string' },
          paymentInstructions: { type: 'string' },
          checkoutFields: { type: 'array', items: { type: 'object' } },
          apiCredentials: { type: 'object' },
          settings: { type: 'object' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.updateGateway.bind(controller));

  // PATCH /payment-gateways/:code/status - Enable or disable a payment gateway
  fastify.patch('/payment-gateways/:code/status', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Enable or disable a payment gateway',
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            enabled: { type: 'boolean' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.setGatewayStatus.bind(controller));

  // PUT /payment-gateways/order - Update payment gateway display order
  fastify.put('/payment-gateways/order', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Update payment gateway display order',
      body: {
        type: 'array',
        items: {
          type: 'object',
          required: ['code', 'order'],
          properties: {
            code: { type: 'string' },
            order: { type: 'number' }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.updateGatewayOrder.bind(controller));

  // POST /payment-gateways/available - Get available payment gateways for an order
  fastify.post('/payment-gateways/available', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Get available payment gateways for an order',
      body: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          country: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId'],
              properties: {
                productId: { type: 'string' },
                categoryId: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: Object.values(PaymentGatewayType) },
              iconUrl: { type: 'string' }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.getAvailableGateways.bind(controller));

  // DELETE /payment-gateways/:code - Delete a payment gateway
  fastify.delete('/payment-gateways/:code', {
    schema: {
      tags: ['payment-gateways'],
      description: 'Delete a payment gateway',
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Payment gateway deleted successfully'
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, controller.deleteGateway.bind(controller));
} 