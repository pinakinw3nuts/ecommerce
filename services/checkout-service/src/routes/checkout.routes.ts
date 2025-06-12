import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { CheckoutService } from '../services/checkout.service';
import { ShippingService } from '../services/shipping.service';
import { CheckoutStatus } from '../entities/CheckoutSession';
import { logger } from '../utils/logger';

// Validation schemas
const cartItemSchema = {
  type: 'object',
  required: ['productId', 'quantity', 'price'],
  properties: {
    productId: { type: 'string', format: 'uuid' },
    quantity: { type: 'number', minimum: 1 },
    price: { type: 'number', minimum: 0 },
    name: { type: 'string' },
    metadata: { 
      type: 'object',
      additionalProperties: true
    }
  }
};

const addressSchema = {
  type: 'object',
  required: ['street', 'city', 'state', 'zipCode', 'country'],
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zipCode: { type: 'string' },
    country: { type: 'string', minLength: 2, maxLength: 2 }
  }
};

const previewOrderResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: cartItemSchema
        },
        subtotal: { type: 'number' },
        tax: { type: 'number' },
        shippingCost: { type: 'number' },
        discount: { type: 'number' },
        total: { type: 'number' }
      }
    }
  }
};

interface RouteOptions {
  checkoutService: CheckoutService;
  shippingService: ShippingService;
}

export default fp(async function checkoutRoutes(
  fastify: FastifyInstance,
  opts: RouteOptions
) {
  const { checkoutService, shippingService } = opts;

  // Register schemas
  fastify.addSchema({
    $id: 'cartItem',
    ...cartItemSchema
  });

  fastify.addSchema({
    $id: 'address',
    ...addressSchema
  });

  // Get order preview
  fastify.post('/preview', {
    schema: {
      description: 'Get order preview with calculated totals',
      tags: ['checkout'],
      body: {
        type: 'object',
        required: ['userId', 'cartItems'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          cartItems: {
            type: 'array',
            items: { $ref: 'cartItem#' }
          },
          couponCode: { type: 'string' },
          shippingAddress: { $ref: 'address#' }
        }
      },
      response: {
        200: previewOrderResponseSchema,
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, cartItems, couponCode, shippingAddress } = request.body as any;
        
        const orderPreview = await checkoutService.calculateOrderPreview(
          userId,
          cartItems,
          couponCode,
          shippingAddress
        );
        
        return { success: true, data: orderPreview };
      } catch (error) {
        logger.error('Error calculating order preview:', error);
        return reply.status(400).send({
          success: false,
          error: 'Preview Calculation Error',
          message: error instanceof Error ? error.message : 'Failed to calculate order preview'
        });
      }
    }
  });

  // Estimate delivery dates
  fastify.post('/delivery-estimate', {
    schema: {
      description: 'Get estimated delivery dates for a shipping method to a country',
      tags: ['shipping'],
      body: {
        type: 'object',
        required: ['method', 'country'],
        properties: {
          method: { 
            type: 'string',
            enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'INTERNATIONAL']
          },
          country: { type: 'string', minLength: 2, maxLength: 2 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                earliest: { type: 'string', format: 'date-time' },
                latest: { type: 'string', format: 'date-time' },
                estimatedDays: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { method, country } = request.body as any;
        
        const dates = await shippingService.estimateDeliveryDate(method, country);
        
        // Get the estimated days text
        const isDomestic = country === 'US';
        const estimatedDays = shippingService.getDeliveryEstimate(method, isDomestic);
        
        return {
          success: true,
          data: {
            earliest: dates.earliest.toISOString(),
            latest: dates.latest.toISOString(),
            estimatedDays
          }
        };
      } catch (error) {
        logger.error('Error estimating delivery dates:', error);
        return reply.status(400).send({
          success: false,
          error: 'Estimation Error',
          message: error instanceof Error ? error.message : 'Failed to estimate delivery dates'
        });
      }
    }
  });

  // Validate postal/zip code
  fastify.post('/validate-pincode', {
    schema: {
      description: 'Validate postal/zip code for a specific country',
      tags: ['shipping'],
      body: {
        type: 'object',
        required: ['pincode', 'country'],
        properties: {
          pincode: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { pincode, country } = request.body as any;
        
        const isValid = await shippingService.validatePincode(pincode, country);
        
        return {
          success: true,
          data: {
            valid: isValid
          }
        };
      } catch (error) {
        logger.error('Error validating pincode:', error);
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: error instanceof Error ? error.message : 'Failed to validate pincode'
        });
      }
    }
  });

  // Get shipping options
  fastify.post('/shipping-options', {
    schema: {
      description: 'Get available shipping options for the order',
      tags: ['shipping'],
      body: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { $ref: 'address#' },
          orderWeight: { type: 'number', minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      method: { type: 'string' },
                      carrier: { type: 'string' },
                      cost: { type: 'number' },
                      estimatedDays: { type: 'string' },
                      estimatedDelivery: {
                        type: 'object',
                        properties: {
                          earliest: { type: 'string', format: 'date-time' },
                          latest: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { address, orderWeight = 1 } = request.body as any;

        // Validate pincode if provided
        if (address.zipCode) {
          const isValid = await shippingService.validatePincode(address.zipCode, address.country);
          if (!isValid) {
            return reply.status(400).send({
              success: false,
              error: 'Validation Error',
              message: 'Invalid postal code for the selected country'
            });
          }
        }

        const shippingOptions = await shippingService.getShippingOptions(
          {
            country: address.country,
            pincode: address.zipCode,
            state: address.state,
            city: address.city
          },
          orderWeight
        );

        // Add estimated delivery dates
        const optionsWithDates = await Promise.all(
          shippingOptions.map(async (option) => {
            const dates = await shippingService.estimateDeliveryDate(
              option.method,
              address.country
            );
            return {
              ...option,
              estimatedDelivery: {
                earliest: dates.earliest.toISOString(),
                latest: dates.latest.toISOString()
              }
            };
          })
        );

        return {
          success: true,
          data: {
            options: optionsWithDates
          }
        };
      } catch (error) {
        logger.error('Error getting shipping options:', error);
        return reply.status(400).send({
          success: false,
          error: 'Shipping Calculation Error',
          message: error instanceof Error ? error.message : 'Failed to calculate shipping options'
        });
      }
    }
  });

  // Create checkout session
  fastify.post('/session', {
    schema: {
      description: 'Create a new checkout session',
      tags: ['checkout'],
      body: {
        type: 'object',
        required: ['userId', 'cartItems'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          cartItems: {
            type: 'array',
            items: { $ref: 'cartItem#' }
          },
          couponCode: { type: 'string' },
          shippingAddress: { $ref: 'address#' },
          billingAddress: { $ref: 'address#' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                status: { 
                  type: 'string',
                  enum: Object.values(CheckoutStatus)
                },
                totals: {
                  type: 'object',
                  properties: {
                    subtotal: { type: 'number' },
                    tax: { type: 'number' },
                    shippingCost: { type: 'number' },
                    discount: { type: 'number' },
                    total: { type: 'number' }
                  }
                },
                expiresAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, cartItems, couponCode, shippingAddress, billingAddress } = request.body as any;
        
        const session = await checkoutService.createCheckoutSession(
          userId,
          cartItems,
          couponCode,
          shippingAddress,
          billingAddress
        );
        
        return { 
          success: true, 
          data: session 
        };
      } catch (error) {
        logger.error('Error creating checkout session:', error);
        return reply.status(400).send({
          success: false,
          error: 'Session Creation Error',
          message: error instanceof Error ? error.message : 'Failed to create checkout session'
        });
      }
    }
  });

  // Get checkout session
  fastify.get('/session/:id', {
    schema: {
      description: 'Get checkout session by ID',
      tags: ['checkout'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                status: { 
                  type: 'string',
                  enum: Object.values(CheckoutStatus)
                },
                // Other session properties
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const session = await checkoutService.getCheckoutSession(id);
      
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: `Checkout session with ID ${id} not found`
        });
      }
      
      return { success: true, data: session };
    }
  });

  // Complete checkout session (after payment)
  fastify.post('/session/:id/complete', {
    schema: {
      description: 'Complete a checkout session after successful payment',
      tags: ['checkout'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['paymentIntentId'],
        properties: {
          paymentIntentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                status: { 
                  type: 'string',
                  enum: [CheckoutStatus.COMPLETED]
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { paymentIntentId } = request.body as { paymentIntentId: string };
        
        const session = await checkoutService.getCheckoutSession(id);
        
        if (!session) {
          return reply.status(404).send({
            success: false,
            error: 'Not Found',
            message: `Checkout session with ID ${id} not found`
          });
        }
        
        if (session.status !== CheckoutStatus.PENDING) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid Status',
            message: `Checkout session is already ${session.status}`
          });
        }
        
        if (session.isExpired()) {
          await checkoutService.expireCheckoutSession(id);
          return reply.status(400).send({
            success: false,
            error: 'Session Expired',
            message: 'Checkout session has expired'
          });
        }
        
        const completedSession = await checkoutService.completeCheckoutSession(id, paymentIntentId);
        
        return { 
          success: true, 
          data: completedSession 
        };
      } catch (error) {
        logger.error('Error completing checkout session:', error);
        return reply.status(500).send({
          success: false,
          error: 'Completion Error',
          message: error instanceof Error ? error.message : 'Failed to complete checkout session'
        });
      }
    }
  });
}); 