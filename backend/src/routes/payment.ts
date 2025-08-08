import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { PaymentStatus, PaymentProvider } from '../entities/Payment';
import { PaymentMethodType, PaymentMethodStatus } from '../entities/PaymentMethod';
import { RefundStatus } from '../entities/Refund';

const paymentService = new PaymentService();

// Request schemas
const CreatePaymentSchema = {
  type: 'object',
  required: ['orderId', 'amount', 'currency', 'paymentMethodId'],
  properties: {
    orderId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', minimum: 0.01 },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    paymentMethodId: { type: 'string', format: 'uuid' },
    provider: { type: 'string', enum: ['stripe', 'razorpay', 'paypal'] },
    description: { type: 'string' }
  }
};

const CreatePaymentMethodSchema = {
  type: 'object',
  required: ['type', 'provider', 'card'],
  properties: {
    type: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET'] },
    provider: { type: 'string' },
    card: {
      type: 'object',
      required: ['number', 'exp_month', 'exp_year', 'cvc'],
      properties: {
        number: { type: 'string', pattern: '^\\d{13,19}$' },
        exp_month: { type: 'number', minimum: 1, maximum: 12 },
        exp_year: { type: 'number', minimum: 2024 },
        cvc: { type: 'string', pattern: '^\\d{3,4}$' }
      }
    },
    isDefault: { type: 'boolean' },
    metadata: { type: 'object' }
  }
};

const UpdatePaymentMethodSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'BLOCKED'] },
    isDefault: { type: 'boolean' },
    metadata: { type: 'object' }
  }
};

const ProcessRefundSchema = {
  type: 'object',
  required: ['amount', 'reason'],
  properties: {
    amount: { type: 'number', minimum: 0.01 },
    reason: { type: 'string', minLength: 1 }
  }
};

const UpdatePaymentStatusSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'] },
    metadata: { type: 'object' }
  }
};

const UpdateRefundStatusSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
    transactionId: { type: 'string' }
  }
};

// TypeScript request body interfaces used for Fastify generics
type CreatePaymentBody = {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  provider?: string; // cast to provider enum at call site
  description?: string;
};

type CreatePaymentMethodBody = {
  type: PaymentMethodType | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  provider: string;
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
};

type UpdatePaymentMethodBody = {
  status?: PaymentMethodStatus | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'BLOCKED';
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
};

type ProcessRefundBody = {
  amount: number;
  reason: string;
};

type UpdatePaymentStatusBody = {
  status: PaymentStatus | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  metadata?: Record<string, unknown>;
};

type UpdateRefundStatusBody = {
  status: RefundStatus | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
};

// Public routes
export async function paymentRoutes(fastify: FastifyInstance) {
  // Get available payment gateways
  fastify.get('/gateways', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const gateways = await paymentService.getPaymentGateways();
      return reply.send({ success: true, data: gateways });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch payment gateways' });
    }
  });

  // Get payment gateway by code
  fastify.get('/gateways/:code', async (request: FastifyRequest<{
    Params: { code: string };
  }>, reply: FastifyReply) => {
    try {
      const { code } = request.params;
      const gateway = await paymentService.getPaymentGatewayByCode(code);
      
      if (!gateway) {
        return reply.status(404).send({ success: false, error: 'Payment gateway not found' });
      }
      
      return reply.send({ success: true, data: gateway });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch payment gateway' });
    }
  });

  // Authenticated routes
  fastify.register(async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', requireUser);

    // Create payment
    fastify.post('/', {
      schema: {
        body: CreatePaymentSchema
      }
    }, async (request: FastifyRequest<{ Body: CreatePaymentBody }>, reply: FastifyReply) => {
      try {
        const { orderId, amount, currency, paymentMethodId, provider, description } = request.body;
        const userId = (request.user as any).id;

        const payment = await paymentService.createPayment({
          orderId,
          userId,
          amount,
          currency,
          paymentMethodId,
          // Cast provider to the service's expected enum/string union
          provider: provider as any,
          description
        });

        return reply.status(201).send({ success: true, data: payment });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create payment' 
        });
      }
    });

    // Get payment by ID
    fastify.get('/:id', async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        const payment = await paymentService.getPaymentById(id);
        
        if (!payment) {
          return reply.status(404).send({ success: false, error: 'Payment not found' });
        }

        // Ensure user can only access their own payments
        if (payment.userId !== userId) {
          return reply.status(403).send({ success: false, error: 'Access denied' });
        }

        return reply.send({ success: true, data: payment });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payment' });
      }
    });

    // Get user's payments
    fastify.get('/', async (request: FastifyRequest<{
      Querystring: {
        page?: number;
        limit?: number;
        status?: PaymentStatus;
      };
    }>, reply: FastifyReply) => {
      try {
        const { page = 1, limit = 10, status } = request.query;
        const userId = (request.user as any).id;

        const result = await paymentService.getPaymentsByCustomerId(userId, {
          status,
          limit,
          offset: (page - 1) * limit
        });

        return reply.send({
          success: true,
          data: result.payments,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payments' });
      }
    });

    // Get payment statistics
    fastify.get('/stats/summary', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const stats = await paymentService.getCustomerPaymentStats(userId);
        
        return reply.send({ success: true, data: stats });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payment statistics' });
      }
    });

    // Create payment method
    fastify.post('/methods', {
      schema: {
        body: CreatePaymentMethodSchema
      }
    }, async (request: FastifyRequest<{ Body: CreatePaymentMethodBody }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const body = request.body;
        const paymentMethod = await paymentService.createPaymentMethod(userId, {
          type: body.type as any,
          provider: body.provider,
          card: {
            number: body.card.number,
            exp_month: body.card.exp_month,
            exp_year: body.card.exp_year,
            cvc: body.card.cvc,
          },
          isDefault: body.isDefault,
          metadata: body.metadata,
        });
        
        return reply.status(201).send({ success: true, data: paymentMethod });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create payment method' 
        });
      }
    });

    // Get user's payment methods
    fastify.get('/methods', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any).id;
        const paymentMethods = await paymentService.getPaymentMethods(userId);
        
        return reply.send({ success: true, data: paymentMethods });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payment methods' });
      }
    });

    // Get payment method by ID
    fastify.get('/methods/:id', async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        const paymentMethod = await paymentService.getPaymentMethodById(userId, id);
        
        if (!paymentMethod) {
          return reply.status(404).send({ success: false, error: 'Payment method not found' });
        }

        return reply.send({ success: true, data: paymentMethod });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payment method' });
      }
    });

    // Update payment method
    fastify.put('/methods/:id', {
      schema: {
        body: UpdatePaymentMethodSchema
      }
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentMethodBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        const updatePayload: Partial<{ status?: PaymentMethodStatus; isDefault?: boolean; metadata?: Record<string, any> }> = {
          isDefault: request.body.isDefault,
          metadata: request.body.metadata as any,
        };
        if (request.body.status) {
          updatePayload.status = request.body.status as PaymentMethodStatus;
        }

        const paymentMethod = await paymentService.updatePaymentMethod(userId, id, updatePayload);
        
        return reply.send({ success: true, data: paymentMethod });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update payment method' 
        });
      }
    });

    // Delete payment method
    fastify.delete('/methods/:id', async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        await paymentService.deletePaymentMethod(userId, id);
        
        return reply.send({ success: true, message: 'Payment method deleted successfully' });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete payment method' 
        });
      }
    });

    // Process refund
    fastify.post('/:id/refunds', {
      schema: {
        body: ProcessRefundSchema
      }
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: ProcessRefundBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { amount, reason } = request.body;
        const userId = (request.user as any).id;

        // Verify payment belongs to user
        const payment = await paymentService.getPaymentById(id);
        if (!payment || payment.userId !== userId) {
          return reply.status(404).send({ success: false, error: 'Payment not found' });
        }

        const refund = await paymentService.processRefund(id, amount, reason, userId);
        
        return reply.status(201).send({ success: true, data: refund });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to process refund' 
        });
      }
    });

    // Get refund by ID
    fastify.get('/refunds/:id', async (request: FastifyRequest<{
      Params: { id: string };
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const userId = (request.user as any).id;

        const refund = await paymentService.getRefundById(id);
        
        if (!refund) {
          return reply.status(404).send({ success: false, error: 'Refund not found' });
        }

        // Verify refund belongs to user
        const payment = await paymentService.getPaymentById(refund.paymentId);
        if (!payment || payment.userId !== userId) {
          return reply.status(403).send({ success: false, error: 'Access denied' });
        }

        return reply.send({ success: true, data: refund });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch refund' });
      }
    });
  });

  // Admin routes
  fastify.register(async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', requireAdmin);

    // Get all payments (admin)
    fastify.get('/admin/payments', async (request: FastifyRequest<{
      Querystring: {
        page?: number;
        pageSize?: number;
        search?: string;
        orderId?: string;
        status?: string;
        provider?: string;
        fromDate?: string;
        toDate?: string;
        minAmount?: number;
        maxAmount?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
    }>, reply: FastifyReply) => {
      try {
        const result = await paymentService.getAllPayments(request.query);
        
        return reply.send({
          success: true,
          data: result.payments,
          pagination: {
            page: request.query.page || 1,
            pageSize: request.query.pageSize || 10,
            total: result.total,
            pages: Math.ceil(result.total / (request.query.pageSize || 10))
          }
        });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payments' });
      }
    });

    // Update payment status (admin)
    fastify.put('/admin/payments/:id/status', {
      schema: {
        body: UpdatePaymentStatusSchema
      }
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentStatusBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { status, metadata } = request.body;

        const payment = await paymentService.updatePaymentStatus(id, status as PaymentStatus, metadata as any);
        
        return reply.send({ success: true, data: payment });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update payment status' 
        });
      }
    });

    // Get all payment methods (admin)
    fastify.get('/admin/methods', async (request: FastifyRequest<{
      Querystring: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
        provider?: string;
        type?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
    }>, reply: FastifyReply) => {
      try {
        const result = await paymentService.getAllPaymentMethods(request.query);
        
        return reply.send({
          success: true,
          data: result.paymentMethods,
          pagination: {
            page: request.query.page || 1,
            pageSize: request.query.pageSize || 10,
            total: result.total,
            pages: Math.ceil(result.total / (request.query.pageSize || 10))
          }
        });
      } catch (error) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch payment methods' });
      }
    });

    // Update refund status (admin)
    fastify.put('/admin/refunds/:id/status', {
      schema: {
        body: UpdateRefundStatusSchema
      }
    }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateRefundStatusBody }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { status, transactionId } = request.body;

        const refund = await paymentService.updateRefundStatus(id, status as RefundStatus, transactionId);
        
        return reply.send({ success: true, data: refund });
      } catch (error) {
        return reply.status(400).send({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update refund status' 
        });
      }
    });
  });
} 