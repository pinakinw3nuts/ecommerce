import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { PaymentGatewayType } from '../entities/payment-gateway.entity';
import { z } from 'zod';
import { logger } from '../utils/logger';

const gatewayLogger = logger.child({ module: 'PaymentGatewayController' });

// Validation schemas
const createGatewaySchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.nativeEnum(PaymentGatewayType),
  enabled: z.boolean().optional().default(true),
  displayOrder: z.number().optional().default(0),
  iconUrl: z.string().optional(),
  redirectUrl: z.string().optional(),
  webhookUrl: z.string().optional(),
  supportsRefunds: z.boolean().optional().default(false),
  supportsSubscriptions: z.boolean().optional().default(false),
  supportsSavedCards: z.boolean().optional().default(false),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  transactionFeePercent: z.number().optional().default(0),
  transactionFeeFixed: z.number().optional().default(0),
  supportedCountries: z.array(z.string()).optional(),
  excludedCountries: z.array(z.string()).optional(),
  supportedCurrencies: z.array(z.string()).optional(),
  defaultOrderStatus: z.string().optional().default('pending'),
  paymentInstructions: z.string().optional(),
  checkoutFields: z.array(z.record(z.any())).optional(),
  apiCredentials: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

const updateGatewaySchema = createGatewaySchema.partial().omit({ code: true });

const updateOrderSchema = z.array(
  z.object({
    code: z.string(),
    order: z.number().int().min(0)
  })
);

const getGatewaysQuerySchema = z.object({
  enabled: z.preprocess(val => val === 'true', z.boolean()).optional(),
  type: z.nativeEnum(PaymentGatewayType).optional(),
  supportRefunds: z.preprocess(val => val === 'true', z.boolean()).optional(),
  supportSubscriptions: z.preprocess(val => val === 'true', z.boolean()).optional(),
  country: z.string().optional(),
  currency: z.string().optional()
});

const getAvailableGatewaysSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  country: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      categoryId: z.string().optional()
    })
  ).optional()
});

export class PaymentGatewayController {
  constructor(private paymentGatewayService: PaymentGatewayService) {}

  /**
   * Get all payment gateways
   */
  async getAllGateways(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = getGatewaysQuerySchema.parse(request.query);
      const gateways = await this.paymentGatewayService.getAllGateways(query);
      return reply.send(gateways);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to get payment gateways');
      return reply.status(500).send({
        error: 'Failed to get payment gateways',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a payment gateway by code
   */
  async getGateway(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      const gateway = await this.paymentGatewayService.getGatewayByCode(code);
      
      if (!gateway) {
        return reply.status(404).send({
          error: 'Payment gateway not found',
          message: `No payment gateway found with code: ${code}`
        });
      }
      
      return reply.send(gateway);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to get payment gateway');
      return reply.status(500).send({
        error: 'Failed to get payment gateway',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new payment gateway
   */
  async createGateway(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createGatewaySchema.parse(request.body);
      const gateway = await this.paymentGatewayService.createGateway(data);
      return reply.status(201).send(gateway);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to create payment gateway');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'Failed to create payment gateway',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update a payment gateway
   */
  async updateGateway(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      const data = updateGatewaySchema.parse(request.body);
      const gateway = await this.paymentGatewayService.updateGateway(code, data);
      return reply.send(gateway);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to update payment gateway');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'Failed to update payment gateway',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Enable or disable a payment gateway
   */
  async setGatewayStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      const { enabled } = request.body as { enabled: boolean };
      const gateway = await this.paymentGatewayService.setGatewayStatus(code, enabled);
      return reply.send(gateway);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to update payment gateway status');
      return reply.status(500).send({
        error: 'Failed to update payment gateway status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update payment gateway display order
   */
  async updateGatewayOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const orders = updateOrderSchema.parse(request.body);
      await this.paymentGatewayService.updateGatewayOrder(orders);
      return reply.send({ success: true });
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to update payment gateway order');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'Failed to update payment gateway order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available payment gateways for an order
   */
  async getAvailableGateways(request: FastifyRequest, reply: FastifyReply) {
    try {
      const orderData = getAvailableGatewaysSchema.parse(request.body);
      const gateways = await this.paymentGatewayService.getAvailableGatewaysForOrder(orderData);
      return reply.send(gateways);
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to get available payment gateways');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        error: 'Failed to get available payment gateways',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a payment gateway
   */
  async deleteGateway(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      await this.paymentGatewayService.deleteGateway(code);
      return reply.status(204).send();
    } catch (error) {
      gatewayLogger.error({ error }, 'Failed to delete payment gateway');
      return reply.status(500).send({
        error: 'Failed to delete payment gateway',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 