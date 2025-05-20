import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { CheckoutService } from '../services/checkout.service';
import { CouponService } from '../services/coupon.service';
import { ShippingService } from '../services/shipping.service';

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
  couponService: CouponService;
  shippingService: ShippingService;
}

export default fp(async function checkoutRoutes(
  fastify: FastifyInstance,
  opts: RouteOptions
) {
  const { checkoutService, couponService, shippingService } = opts;

  // Register schemas
  fastify.addSchema({
    $id: 'cartItem',
    ...cartItemSchema
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
            items: cartItemSchema
          },
          couponCode: { type: 'string' }
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
    handler: async (request) => {
      const { userId, cartItems, couponCode } = request.body as any;
      const orderPreview = await checkoutService.calculateOrderPreview(
        userId,
        cartItems,
        couponCode
      );
      return { success: true, data: orderPreview };
    }
  });

  // Apply coupon
  fastify.post('/apply-coupon', {
    schema: {
      description: 'Apply a coupon code to the order',
      tags: ['checkout'],
      body: {
        type: 'object',
        required: ['userId', 'cartItems', 'couponCode'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          cartItems: {
            type: 'array',
            items: cartItemSchema
          },
          couponCode: { type: 'string', minLength: 1 }
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
                discountAmount: { type: 'number' },
                coupon: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    type: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
                    value: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request) => {
      const { userId, cartItems, couponCode } = request.body as any;
      
      // Get current cart total first
      const preview = await checkoutService.calculateOrderPreview(userId, cartItems);
      
      const result = await couponService.applyCoupon(
        couponCode,
        preview.subtotal
      );

      return {
        success: true,
        data: {
          discountAmount: result.discountAmount,
          coupon: {
            code: result.coupon.code,
            type: result.coupon.type,
            value: result.coupon.value
          }
        }
      };
    }
  });

  // Get shipping options
  fastify.get('/shipping-options', {
    schema: {
      description: 'Get available shipping options for the order',
      tags: ['checkout'],
      querystring: {
        type: 'object',
        required: ['cartItems', 'country'],
        properties: {
          cartItems: {
            type: 'array',
            items: cartItemSchema
          },
          country: { type: 'string', minLength: 2, maxLength: 2 },
          pincode: { type: 'string' },
          state: { type: 'string' },
          city: { type: 'string' },
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
                      cost: { type: 'number' },
                      estimatedDelivery: {
                        type: 'object',
                        properties: {
                          earliest: { type: 'string', format: 'date-time' },
                          latest: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                },
                weightUsed: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request) => {
      const {
        cartItems,
        country,
        pincode,
        state,
        city,
        orderWeight
      } = request.query as any;

      // Calculate final weight
      let finalWeight = orderWeight;
      if (!finalWeight) {
        finalWeight = cartItems.reduce(
          (total: number, item: { metadata?: { weight?: number }; quantity: number }) => 
            total + (item.metadata?.weight || 0.1) * item.quantity,
          0
        );
      }

      // Validate pincode if provided
      if (pincode) {
        const isValid = await shippingService.validatePincode(pincode, country);
        if (!isValid) {
          throw fastify.httpErrors.notFound('Invalid pincode for the selected country');
        }
      }

      const shippingOptions = await shippingService.getShippingOptions(
        {
          country,
          pincode: pincode || '',
          state: state || '',
          city: city || ''
        },
        finalWeight
      );

      // Add estimated delivery dates
      const optionsWithDates = await Promise.all(
        shippingOptions.map(async (option) => {
          const dates = await shippingService.estimateDeliveryDate(
            option.method,
            country
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
          options: optionsWithDates,
          weightUsed: finalWeight
        }
      };
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
            items: cartItemSchema
          },
          couponCode: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {              type: 'object',              required: ['id', 'userId', 'status'],              properties: {                id: { type: 'string', format: 'uuid' },                userId: { type: 'string', format: 'uuid' },                cartSnapshot: {                  type: 'array',                  items: cartItemSchema                },                status: {                  type: 'string',                  enum: ['PENDING', 'COMPLETED', 'EXPIRED', 'FAILED']                },                totals: {                  type: 'object',                  properties: {                    subtotal: { type: 'number' },                    tax: { type: 'number' },                    shippingCost: { type: 'number' },                    discount: { type: 'number' },                    total: { type: 'number' }                  }                },                shippingAddress: {                  type: 'object',                  properties: {                    street: { type: 'string' },                    city: { type: 'string' },                    state: { type: 'string' },                    zipCode: { type: 'string' },                    country: { type: 'string' }                  }                },                billingAddress: {                  type: 'object',                  properties: {                    street: { type: 'string' },                    city: { type: 'string' },                    state: { type: 'string' },                    zipCode: { type: 'string' },                    country: { type: 'string' }                  }                },                discountCode: { type: 'string' },                paymentIntentId: { type: 'string' },                expiresAt: { type: 'string', format: 'date-time' },                createdAt: { type: 'string', format: 'date-time' },                updatedAt: { type: 'string', format: 'date-time' }              }            }
          }
        }
      }
    },
    handler: async (request) => {
      const { userId, cartItems, couponCode } = request.body as any;
      const session = await checkoutService.createCheckoutSession(
        userId,
        cartItems,
        couponCode
      );
      return { success: true, data: session };
    }
  });
}); 