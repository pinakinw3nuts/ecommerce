import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { forwardRequest } from '../utils/httpClient';
import { config } from '../config/env';
import { httpLogger as logger } from '../utils/logger';

// Define types for request and response data
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

interface Cart {
  id: string;
  items: CartItem[];
  [key: string]: any;
}

interface CompleteCheckoutBody {
  cartId: string;
  shippingMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    [key: string]: any;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    [key: string]: any;
  };
  paymentMethod: {
    type: string;
    [key: string]: any;
  };
}

const ecommerceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Log when routes are being registered
  logger.info('Registering ecommerce integration routes');

  // Update shipping address for a checkout session
  fastify.put('/v1/checkout/session/:sessionId/shipping-address', async (request: AuthenticatedRequest, reply) => {
    try {
      const userId = request.user?.userId;
      const sessionId = (request.params as { sessionId: string }).sessionId;
      const { address } = request.body as { address: any }; // Assuming address is sent in body

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication is required to update shipping address'
        });
      }
      if (!sessionId || !address) {
        return reply.status(400).send({
          success: false,
          message: 'Missing session ID or address data'
        });
      }

      const checkoutServiceUrl = config.services.checkout;
      const response = await forwardRequest({
        method: 'PUT',
        url: `${checkoutServiceUrl}/api/v1/checkout/session/${sessionId}/shipping-address`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(checkoutServiceUrl).host,
        },
        body: { address },
      });

      if (response.status !== 200 || !response.body) {
        return reply.status(response.status).send({
          success: false,
          message: 'Failed to update shipping address',
          error: response.body || 'Checkout service error'
        });
      }

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error updating shipping address for checkout session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get cart and available shipping methods
  fastify.get('/v1/checkout/cart-summary', async (request: AuthenticatedRequest, reply) => {
    try {
      const userId = request.user?.userId;
      const deviceId = request.headers['x-device-id'] as string;

      if (!userId && !deviceId) {
        return reply.status(400).send({
          success: false,
          message: 'Either authentication or x-device-id header is required'
        });
      }

      // Step 1: Get cart from cart service
      const cartServiceUrl = config.services.cart;
      const cartQueryParam = userId ? `?userId=${userId}` : deviceId ? `?deviceId=${deviceId}` : '';

      logger.info({
        msg: 'Fetching cart for checkout summary',
        url: `${cartServiceUrl}/api/v1/cart${cartQueryParam}`,
        userId: userId || 'none',
        deviceId: deviceId || 'none',
      });

      const cartResponse = await forwardRequest({
        method: 'GET',
        url: `${cartServiceUrl}/api/v1/cart${cartQueryParam}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(cartServiceUrl).host,
        },
      });

      if (cartResponse.status !== 200 || !cartResponse.body) {
        return reply.status(cartResponse.status).send({
          success: false,
          message: 'Failed to fetch cart',
          error: 'Cart service error'
        });
      }

      const cart = cartResponse.body as Cart;

      // Step 2: Get shipping methods from checkout service
      const checkoutServiceUrl = config.services.checkout;

      const shippingResponse = await forwardRequest({
        method: 'GET',
        url: `${checkoutServiceUrl}/api/v1/checkout/shipping-methods`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(checkoutServiceUrl).host,
        },
      });

      // Step 3: Combine the data
      return reply.status(200).send({
        success: true,
        data: {
          cart,
          shippingMethods: shippingResponse.status === 200 ? shippingResponse.body : [],
        }
      });
    } catch (error) {
      logger.error({
        msg: 'Error in checkout cart summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch checkout summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Complete checkout flow
  fastify.post<{
    Body: CompleteCheckoutBody
  }>('/v1/checkout/complete', async (request: AuthenticatedRequest & { body: CompleteCheckoutBody }, reply) => {
    try {
      const userId = request.user?.userId;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication is required to complete checkout'
        });
      }

      const checkoutServiceUrl = config.services.checkout;

      logger.info({
        msg: 'Completing checkout',
        url: `${checkoutServiceUrl}/api/v1/checkout/complete`,
        userId,
      });

      // Forward the request to the checkout service
      const response = await forwardRequest({
        method: 'POST',
        url: `${checkoutServiceUrl}/api/v1/checkout/complete`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(checkoutServiceUrl).host,
        },
        body: request.body,
      });

      if (response.status !== 200 || !response.body) {
        return reply.status(response.status).send({
          success: false,
          message: 'Failed to complete checkout',
          error: response.body || 'Checkout service error'
        });
      }

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error completing checkout',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Place an order from a checkout session
  // Place an order from a checkout session
  fastify.post('/v1/orders/checkout', async (request: AuthenticatedRequest, reply) => {
    try {
      const userId = request.user?.userId;
      const { checkoutSessionId } = request.body as { checkoutSessionId: string };

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication is required to place an order'
        });
      }
      if (!checkoutSessionId) {
        return reply.status(400).send({
          success: false,
          message: 'Missing checkout session ID'
        });
      }

      const orderServiceUrl = config.services.order;
      logger.info({
        msg: 'Placing order from checkout session',
        url: `${orderServiceUrl}/api/v1/orders/checkout`,
        userId,
        checkoutSessionId,
      });

      const response = await forwardRequest({
        method: 'POST',
        url: `${orderServiceUrl}/api/v1/orders/checkout`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(orderServiceUrl).host,
        },
        body: { checkoutSessionId },
      });

      if (response.status !== 200 || !response.body) {
        return reply.status(response.status).send({
          success: false,
          message: 'Failed to place order',
          error: response.body || 'Order service error'
        });
      }

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error placing order from checkout session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handler function for shipping options
  const handleShippingOptions = async (request: AuthenticatedRequest, reply: any) => {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication is required for shipping options'
        });
      }

      // Forward request to checkout service
      const checkoutServiceUrl = config.services.checkout;
      logger.info({
        msg: 'Forwarding shipping options request to checkout service',
        url: `${checkoutServiceUrl}/api/v1/checkout/shipping-options`,
        userId
      });

      const response = await forwardRequest({
        method: 'POST',
        url: `${checkoutServiceUrl}/api/v1/checkout/shipping-options`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(checkoutServiceUrl).host,
        },
        body: request.body
      });

      if (response.status !== 200) {
        logger.error({
          msg: 'Error from checkout service for shipping options',
          status: response.status,
          response: response.body
        });
        return reply.status(response.status).send(response.body);
      }

      return reply.send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error getting shipping options',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get shipping options',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Register routes for shipping options
  fastify.post('/v1/checkout/shipping-options', handleShippingOptions);

  logger.info('Registered shipping options routes', {
    routes: [
      '/v1/checkout/shipping-options'
    ]
  });

  // Order routes
  // GET /v1/orders - Get all orders for authenticated user
  fastify.get('/v1/orders', async (request, reply) => {
    try {
      const orderServiceUrl = config.services.order;
      const queryString = request.url.includes('?') 
        ? request.url.substring(request.url.indexOf('?')) 
        : '';
      
      logger.info({
        msg: 'Forwarding orders request',
        url: `${orderServiceUrl}/api/v1/public/orders${queryString}`,
        method: 'GET'
      });

      // Forward to order service with public endpoint
      const response = await forwardRequest({
        method: 'GET',
        url: `${orderServiceUrl}/api/v1/public/orders${queryString}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(orderServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Orders response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in orders proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /v1/orders/:id - Get specific order
  fastify.get('/v1/orders/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const orderServiceUrl = config.services.order;
      
      logger.info({
        msg: 'Forwarding order details request',
        url: `${orderServiceUrl}/api/v1/public/orders/${id}`,
        method: 'GET'
      });

      // Forward to order service with public endpoint
      const response = await forwardRequest({
        method: 'GET',
        url: `${orderServiceUrl}/api/v1/public/orders/${id}`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(orderServiceUrl).host,
        },
      });

      // Log successful response
      logger.debug({
        msg: 'Order details response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in order details proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch order details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /v1/orders/:id/cancel - Cancel an order
  fastify.post('/v1/orders/:id/cancel', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const orderServiceUrl = config.services.order;
      
      logger.info({
        msg: 'Forwarding order cancellation request',
        url: `${orderServiceUrl}/api/v1/public/orders/${id}/cancel`,
        method: 'POST'
      });

      // Forward to order service with public endpoint
      const response = await forwardRequest({
        method: 'POST',
        url: `${orderServiceUrl}/api/v1/public/orders/${id}/cancel`,
        headers: {
          ...request.headers as Record<string, string | string[] | undefined>,
          host: new URL(orderServiceUrl).host,
          'content-type': 'application/json'
        },
        body: request.body
      });

      // Log successful response
      logger.debug({
        msg: 'Order cancellation response received',
        status: response.status
      });

      return reply.status(response.status).send(response.body);
    } catch (error) {
      logger.error({
        msg: 'Error in order cancellation proxy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to cancel order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default ecommerceRoutes; 