import { FastifyInstance } from 'fastify';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/Order';
import { logger } from '../utils/logger';
import { CreateOrderDto, CreateOrderItemDto } from '../services/order.service';
import { config } from '../config/env';

export interface CreateOrderFromCheckoutDto {
  checkoutSessionId: string;
}

function forceIPv4(url: string): string {
  return url.replace('localhost', '127.0.0.1');
}

export async function orderCheckoutRoutes(fastify: FastifyInstance, options: { orderService: OrderService }) {
  const { orderService } = options;

  // Log registration of public checkout routes
  logger.info('Registering public checkout routes (no JWT auth required)');

  // The OPTIONS handler is not needed as fastifyCors already handles this
  // Removing it to avoid conflicts

  // Create an order from checkout session - PUBLIC ENDPOINT (no JWT required)
  fastify.post<{ Body: CreateOrderFromCheckoutDto }>(
    '',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Create an order from checkout session',
        description: 'Create a new order from the provided checkout session ID. No authentication required.',
        body: {
          type: 'object',
          required: ['checkoutSessionId'],
          properties: {
            checkoutSessionId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              orderId: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    price: { type: 'number' },
                    quantity: { type: 'number' }
                  }
                }
              },
              totalAmount: { type: 'number' },
              shippingAddress: {
                type: 'object',
                additionalProperties: true
              },
              billingAddress: {
                type: 'object',
                additionalProperties: true
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      // Add explicit preHandler for debugging
      preHandler: (request, reply, done) => {
        // Log incoming request details for debugging
        logger.debug(`Processing checkout request from origin: ${request.headers.origin}`);
        logger.debug(`Request headers: ${JSON.stringify(request.headers)}`);

        // Continue processing
        done();
      }
    },
    async (request, reply) => {
      try {
        const { checkoutSessionId } = request.body;

        if (!checkoutSessionId) {
          return reply.status(400).send({ message: 'Checkout session ID is required' });
        }

        logger.info(`Creating order from checkout session: ${checkoutSessionId}`);

        // Get checkout service URL from config
        const checkoutServiceUrl = config.services?.checkout || process.env.CHECKOUT_SERVICE_URL || 'http://localhost:3005';
        logger.debug(`Using checkout service URL: ${checkoutServiceUrl}`);

        try {
          // Extract user ID from JWT token if available
          const userId = (request as any).user?.userId || "cc0c7021-e693-412e-9549-6c80ef327e39"; // Default user ID

          // Determine if we should use a real or mock session
          let session;

          try {
            // Correct endpoint based on the checkout service implementation
            const requestUrl = `${forceIPv4(checkoutServiceUrl)}/api/v1/session/${checkoutSessionId}`;
            logger.debug(`Fetching checkout session from: ${requestUrl}`);
            // Use a more robust fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 5 second timeout

            let response;
            try {
              response = await fetch(requestUrl, {
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
            } catch (fetchError) {
              clearTimeout(timeoutId);
              logger.error(
                `Network error fetching checkout session ${checkoutSessionId}:`,
                fetchError,
                (fetchError as Error)?.stack
              );

              if ((fetchError as any)?.name === 'AbortError') {
                return reply.status(504).send({ message: 'Timeout fetching checkout session from checkout-service' });
              }
              return reply.status(502).send({
                message: 'Network error fetching checkout session from checkout-service',
                error: (fetchError as Error)?.message || String(fetchError)
              });
            }
            clearTimeout(timeoutId);

            // Handle response status
            if (!response.ok) {
              const errorText = await response.text();
              logger.error(`Failed to fetch checkout session ${checkoutSessionId}:`, {
                status: response.status,
                statusText: response.statusText,
                body: errorText
              });
              if (response.status === 404) {
                return reply.status(404).send({ message: `Checkout session with ID ${checkoutSessionId} not found` });
              }
              return reply.status(500).send({ message: `Could not retrieve checkout session: ${response.statusText}` });
            }
            // Parse response JSON
            const sessionResponse = await response.json();
            logger.debug(`Received checkout session response: ${JSON.stringify(sessionResponse).substring(0, 200)}...`);
            // Extract session data from the response structure
            session = sessionResponse.data || sessionResponse;
            if (!session) {
              return reply.status(500).send({ message: 'Invalid checkout session response format' });
            }
          } catch (error) {
            logger.error(`Network error fetching checkout session ${checkoutSessionId}:`, error);
            return reply.status(500).send({ message: 'Failed to fetch checkout session from checkout-service', error: error instanceof Error ? error.message : String(error) });
          }

          if (session.status !== 'COMPLETED') {
            logger.error(`Cannot create order for incomplete checkout session: ${checkoutSessionId}, status: ${session.status}`);
            return reply.status(400).send({
              message: `Cannot create order for checkout session with status ${session.status}`
            });
          }

          if (!session.cartSnapshot || !Array.isArray(session.cartSnapshot)) {
            logger.error(`Checkout session ${checkoutSessionId} has no cart items`);
            return reply.status(400).send({
              message: 'Checkout session has no cart items'
            });
          }

          // Create order DTO from session data
          const orderItems: CreateOrderItemDto[] = session.cartSnapshot.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || undefined, // Convert null to undefined for type compatibility
            quantity: item.quantity,
            price: item.price,
            name: item.name || 'Unknown Product',
            image: item.image || item.productSnapshot?.imageUrl,
            sku: item.sku || '',
            additionalImages: item.additionalImages || item.productSnapshot?.additionalImages,
            variantName: item.variantName || item.productSnapshot?.variantName,
            description: item.description || item.productSnapshot?.description,
            originalPrice: item.originalPrice || item.productSnapshot?.originalPrice,
            salePrice: item.salePrice || item.productSnapshot?.salePrice,
            brand: item.brand || item.productSnapshot?.brand,
            category: item.category || item.productSnapshot?.category,
            attributes: item.attributes || item.productSnapshot?.attributes,
            dimensions: item.dimensions || item.productSnapshot?.dimensions,
            slug: item.slug || item.productSnapshot?.slug,
            metadata: {
              name: item.productSnapshot?.name || item.name || 'Unknown Product',
              image: item.productSnapshot?.imageUrl || item.image,
              sku: item.productSnapshot?.sku || item.sku,
              variantName: item.productSnapshot?.variantName || item.variantName
            }
          }));

          if (orderItems.length === 0) {
            logger.error(`Checkout session ${checkoutSessionId} has empty cart`);
            return reply.status(400).send({
              message: 'Cannot create order with empty cart'
            });
          }

          // Set metadata with unique order number
          const timestamp = new Date().getTime().toString().slice(-6);
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
          const orderMetadata = {
            checkoutSessionId,
            orderNumber: `ORD-${timestamp}-${randomStr}`,
            paymentIntentId: session.paymentIntentId
          };

          // Create order DTO
          const orderDto: CreateOrderDto = {
            userId: session.userId,
            items: orderItems,
            shippingAddress: session.shippingAddress,
            billingAddress: session.billingAddress || session.shippingAddress,
            metadata: orderMetadata,
            subtotal: session.totals?.subtotal,
            taxAmount: session.totals?.tax,
            shippingAmount: session.totals?.shippingCost,
            discountAmount: session.totals?.discount,
            totalAmount: session.totals?.total
          };

          // Create and save the order
          const createdOrder = await orderService.createOrder(orderDto);

          logger.info(`Created order ${createdOrder.id} from checkout session ${checkoutSessionId}`);

          return reply.status(201).send(createdOrder);
        } catch (error) {
          logger.error(`Failed to process checkout session ${checkoutSessionId}:`, error);
          return reply.status(500).send({
            message: 'Failed to create order from checkout session',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      } catch (error) {
        logger.error('Error creating order from checkout:', error);
        return reply.status(500).send({
          message: 'Failed to create order from checkout',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
} 