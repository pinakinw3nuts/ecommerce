import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CheckoutService } from '../services/checkout.service';
import { OrderStatus, ShippingMethod } from '../entities/Order';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';

const checkoutService = new CheckoutService();

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to format order response
function formatOrderResponse(order: any) {
  return order.toJSON();
}

// Zod schemas for validation
const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
});

const billingAddressSchema = shippingAddressSchema;

const calculateShippingSchema = z.object({
  shippingAddress: shippingAddressSchema,
  method: z.nativeEnum(ShippingMethod).optional(),
});

const placeOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: billingAddressSchema.optional(),
  shippingMethod: z.nativeEnum(ShippingMethod).optional(),
  paymentMethod: z.string().optional(),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

const orderQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val) || 1).optional().default(1),
  limit: z.string().or(z.number()).transform(val => Number(val) || 10).optional().default(10),
  status: z.nativeEnum(OrderStatus).optional(),
});

export default async function checkoutRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all checkout routes
  fastify.addHook('preHandler', requireUser());

  // POST /api/checkout/validate-cart - Validate cart before checkout
  fastify.post('/validate-cart', {
    schema: {
      tags: ['Checkout'],
      summary: 'Validate cart before checkout',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Validating cart for checkout:', { userId: user.userId });

      const validation = await checkoutService.validateCart(user.userId);
      
      return reply.send({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error('Error validating cart for checkout:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to validate cart',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/checkout/calculate-shipping - Calculate shipping costs
  fastify.post('/calculate-shipping', {
    schema: {
      tags: ['Checkout'],
      summary: 'Calculate shipping costs',
      body: {
        type: 'object',
        required: ['shippingAddress'],
        properties: {
          shippingAddress: { type: 'object' },
          method: { type: 'string' }
        }
      },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { shippingAddress, method } = calculateShippingSchema.parse(request.body);
      
      // Ensure all required shipping address properties are provided
      if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.street || 
          !shippingAddress.city || !shippingAddress.state || !shippingAddress.country || !shippingAddress.zipCode) {
        return reply.status(400).send({
          success: false,
          message: 'All shipping address fields are required',
          error: 'MISSING_REQUIRED_FIELDS',
        });
      }
      
      logger.info('Calculating shipping costs:', { userId: user.userId, method });

      const shippingOptions = await checkoutService.calculateShipping(
        user.userId,
        {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          street: shippingAddress.street,
          apartment: shippingAddress.apartment || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          zipCode: shippingAddress.zipCode,
          phone: shippingAddress.phone || '',
        },
        method
      );
      
      return reply.send({
        success: true,
        data: shippingOptions,
      });
    } catch (error) {
      logger.error('Error calculating shipping:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid shipping data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to calculate shipping',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/checkout/process-payment - Process payment (stub)
  fastify.post('/process-payment', {
    schema: {
      tags: ['Checkout'],
      summary: 'Process payment (stub)',
      description: 'This endpoint simulates a payment processing flow in development and does not capture real payments. To enable Stripe, wire PaymentService to Stripe Intents.',
      body: { type: 'object', required: ['amount'], properties: { amount: { type: 'number' }, paymentMethod: { type: 'string' } } },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } }, 400: { type: 'object' } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { amount, paymentMethod } = z.object({
        amount: z.number().min(0.01, 'Amount must be greater than 0'),
        paymentMethod: z.string().optional().default('card'),
      }).parse(request.body);
      
      logger.info('Processing payment:', { userId: user.userId, amount, paymentMethod });

      const paymentResult = await checkoutService.processPayment(
        user.userId,
        amount,
        paymentMethod
      );
      
      if (paymentResult.success) {
        return reply.send({
          success: true,
          data: paymentResult,
        });
      } else {
        return reply.status(400).send({
          success: false,
          message: paymentResult.error || 'Payment failed',
          error: 'PAYMENT_FAILED',
        });
      }
    } catch (error) {
      logger.error('Error processing payment:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid payment data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to process payment',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/checkout/place-order - Place order
  fastify.post('/place-order', {
    schema: {
      tags: ['Checkout'],
      summary: 'Place order',
      body: { type: 'object' },
      response: { 200: { type: 'object' }, 400: { type: 'object' } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const orderData = placeOrderSchema.parse(request.body);
      
      // Ensure all required shipping address properties are provided
      if (orderData.shippingAddress && (!orderData.shippingAddress.firstName || !orderData.shippingAddress.lastName || 
          !orderData.shippingAddress.street || !orderData.shippingAddress.city || !orderData.shippingAddress.state || 
          !orderData.shippingAddress.country || !orderData.shippingAddress.zipCode)) {
        return reply.status(400).send({
          success: false,
          message: 'All shipping address fields are required',
          error: 'MISSING_REQUIRED_FIELDS',
        });
      }
      
      logger.info('Placing order:', { userId: user.userId });

      const order = await checkoutService.placeOrder(user.userId, {
        ...orderData,
        shippingAddress: orderData.shippingAddress ? {
          firstName: orderData.shippingAddress.firstName,
          lastName: orderData.shippingAddress.lastName,
          street: orderData.shippingAddress.street,
          apartment: orderData.shippingAddress.apartment || '',
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          country: orderData.shippingAddress.country,
          zipCode: orderData.shippingAddress.zipCode,
          phone: orderData.shippingAddress.phone || '',
        } : undefined,
        billingAddress: orderData.billingAddress ? {
          firstName: orderData.billingAddress.firstName,
          lastName: orderData.billingAddress.lastName,
          street: orderData.billingAddress.street,
          apartment: orderData.billingAddress.apartment || '',
          city: orderData.billingAddress.city,
          state: orderData.billingAddress.state,
          country: orderData.billingAddress.country,
          zipCode: orderData.billingAddress.zipCode,
          phone: orderData.billingAddress.phone || '',
        } : undefined,
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Order placed successfully',
        data: formatOrderResponse(order),
      });
    } catch (error) {
      logger.error('Error placing order:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid order data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('Cart validation failed')) {
        return reply.status(400).send({
          success: false,
          message: error.message,
          error: 'CART_VALIDATION_FAILED',
        });
      }
      
      if (error instanceof Error && error.message.includes('Payment failed')) {
        return reply.status(400).send({
          success: false,
          message: error.message,
          error: 'PAYMENT_FAILED',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to place order',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // GET /api/checkout/order/:id - Get order by ID
  fastify.get('/order/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: orderId } = request.params;
      
      if (!isValidUUID(orderId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid order ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Getting order by ID:', { userId: user.userId, orderId });

      const order = await checkoutService.getOrderById(user.userId, orderId);
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND',
        });
      }
      
      return reply.send({
        success: true,
        data: formatOrderResponse(order),
      });
    } catch (error) {
      logger.error('Error getting order by ID:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get order',
        error: 'INTERNAL_ERROR',
      });
    }
  });



  // PUT /api/checkout/order/:id/status - Update order status (admin only - can be enhanced later)
  fastify.put('/order/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id: orderId } = request.params;
      const { status } = z.object({
        status: z.nativeEnum(OrderStatus),
      }).parse(request.body);
      
      if (!isValidUUID(orderId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid order ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Updating order status:', { orderId, status });

      const order = await checkoutService.updateOrderStatus(orderId, status);
      
      return reply.send({
        success: true,
        message: 'Order status updated successfully',
        data: formatOrderResponse(order),
      });
    } catch (error) {
      logger.error('Error updating order status:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid status data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('Order not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'ORDER_NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update order status',
        error: 'INTERNAL_ERROR',
      });
    }
  });
}