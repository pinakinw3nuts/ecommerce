import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CheckoutService } from '../services/checkout.service';
import { CouponService } from '../services/coupon.service';
import { ShippingService } from '../services/shipping.service';
import { validateZodSchema } from '../utils/validate-schema';
import logger from '../utils/logger';

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
  cartItems: z.array(cartItemSchema),
  couponCode: z.string().optional()
});

const applyCouponSchema = z.object({
  userId: z.string().uuid(),
  cartItems: z.array(cartItemSchema),
  couponCode: z.string().min(1)
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
  couponService: CouponService,
  shippingService: ShippingService
) {
  // Get order preview
  fastify.post('/checkout/preview', {
    handler: async (request) => {
      const { userId, cartItems, couponCode } = validateZodSchema(previewOrderSchema, request.body);

      try {
        const orderPreview = await checkoutService.calculateOrderPreview(
          userId,
          cartItems,
          couponCode
        );

        return {
          success: true,
          data: orderPreview
        };
      } catch (error: any) {
        if (error.message === 'Cart is empty') {
          throw fastify.httpErrors.notFound('Cart is empty');
        }
        throw error;
      }
    }
  });

  // Apply coupon
  fastify.post('/checkout/apply-coupon', {
    handler: async (request) => {
      const { userId, cartItems, couponCode } = validateZodSchema(applyCouponSchema, request.body);

      try {
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
      } catch (error: any) {
        if (error.name === 'CouponValidationError') {
          throw fastify.httpErrors.notFound(error.message);
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
          throw fastify.httpErrors.notFound('Cart is empty');
        }
        throw error;
      }
    }
  });
} 