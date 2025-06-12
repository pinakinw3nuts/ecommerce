import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CheckoutService } from '../services/checkout.service';
import { ShippingService } from '../services/shipping.service';
import { validateZodSchema } from '../utils/validate-schema';
import { logger } from '../utils/logger';
import { CartItem } from '../entities/checkout-session.entity';

// Cart item schema
const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  name: z.string(),
  metadata: z.record(z.any()).optional()
});

// Input validation schemas
const previewOrderSchema = z.object({
  userId: z.string().uuid(),
  cartItems: z.array(cartItemSchema)
});

const shippingOptionsSchema = z.object({
  userId: z.string().uuid(),
  cartItems: z.array(cartItemSchema),
  country: z.string().length(2).toUpperCase(),
  pincode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  orderWeight: z.number().positive().optional()
});

export async function checkoutController(
  fastify: FastifyInstance,
  checkoutService: CheckoutService,
  shippingService: ShippingService
) {
  // Get order preview
  fastify.post('/checkout/preview', {
    handler: async (request) => {
      const { userId, cartItems } = validateZodSchema(previewOrderSchema, request.body);

      try {
        const orderPreview = await checkoutService.calculateOrderPreview(
          userId,
          cartItems as CartItem[]
        );

        return {
          success: true,
          data: orderPreview
        };
      } catch (error: any) {
        if (error.message === 'Cart is empty') {
          throw new Error('Cart is empty');
        }
        throw error;
      }
    }
  });

  // Get shipping options
  fastify.get('/checkout/shipping-options', {
    handler: async (request) => {
      const {
        userId,
        cartItems,
        country,
        pincode,
        state,
        city,
        orderWeight
      } = validateZodSchema(shippingOptionsSchema, request.query);

      try {
        logger.info({ userId, country, pincode }, 'Calculating shipping options');

        // Get cart for weight calculation if not provided
        let finalWeight = orderWeight;
        if (!finalWeight) {
          finalWeight = cartItems.reduce(
            (total, item) => total + (item.metadata?.weight || 0.1) * item.quantity,
            0
          );
        }

        // Validate pincode if provided
        if (pincode) {
          const isValid = await shippingService.validatePincode(pincode, country);
          if (!isValid) {
            logger.warn({ userId, country, pincode }, 'Invalid pincode provided');
            throw new Error('Invalid pincode for the selected country');
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

        logger.info({ userId, optionsCount: optionsWithDates.length }, 'Shipping options calculated');

        return {
          success: true,
          data: {
            options: optionsWithDates,
            weightUsed: finalWeight
          }
        };
      } catch (error: any) {
        if (error.message === 'Cart is empty') {
          throw new Error('Cart is empty');
        }
        throw error;
      }
    }
  });
} 