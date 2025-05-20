import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CouponService } from '../services/coupon.service';
import { validateZodSchema } from '../utils/validate-schema';
import { authGuard } from '../middleware/auth.guard';
import { roleGuard } from '../middleware/role.guard';
import { CouponType } from '../entities/Coupon';

// Input validation schemas
const createCouponSchema = z.object({
  code: z.string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  type: z.enum([CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT]),
  value: z.number()
    .positive()
    .superRefine((val, ctx) => {
      const type = (ctx as any).parent?.type;
      if (type === CouponType.PERCENTAGE && val > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage value must be between 0 and 100'
        });
        return false;
      }
      return true;
    }),
  expiresAt: z.string()
    .datetime()
    .optional(),
  maxUses: z.number()
    .int()
    .positive()
    .optional(),
  minimumPurchaseAmount: z.number()
    .positive()
    .optional(),
  applicableProducts: z.array(z.string())
    .optional(),
  isActive: z.boolean()
    .default(true)
});

const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive()
});

export async function couponController(fastify: FastifyInstance, couponService: CouponService) {
  // Create coupon
  fastify.post('/coupons', {
    preHandler: [authGuard, roleGuard('admin')],
    handler: async (request) => {
      const couponData = validateZodSchema(createCouponSchema, request.body);

      // Check if coupon code already exists
      const existingCoupon = await couponService.findByCode(couponData.code);
      if (existingCoupon) {
        throw fastify.httpErrors.conflict('Coupon code already exists');
      }

      const coupon = {
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        isActive: couponData.isActive,
        expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
        maxUses: couponData.maxUses ?? null,
        minimumPurchaseAmount: couponData.minimumPurchaseAmount ?? null,
        applicableProducts: couponData.applicableProducts ?? null
      };

      const createdCoupon = await couponService.create(coupon);

      return {
        success: true,
        data: {
          id: createdCoupon.id,
          code: createdCoupon.code,
          type: createdCoupon.type,
          value: createdCoupon.value,
          expiresAt: createdCoupon.expiresAt?.toISOString(),
          maxUses: createdCoupon.maxUses,
          currentUses: 0,
          isActive: createdCoupon.isActive,
          minimumPurchaseAmount: createdCoupon.minimumPurchaseAmount,
          applicableProducts: createdCoupon.applicableProducts
        }
      };
    }
  });

  // Validate coupon
  fastify.post('/coupons/validate', {
    handler: async (request) => {
      const { code, subtotal } = validateZodSchema(validateCouponSchema, request.body);

      try {
        const validation = await couponService.validateCoupon(code, subtotal);

        if (!validation.isValid) {
          return {
            success: false,
            message: validation.message
          };
        }

        const discountAmount = couponService.calculateDiscountAmount(
          validation.coupon!,
          subtotal
        );

        return {
          success: true,
          data: {
            isValid: true,
            discountAmount,
            coupon: {
              code: validation.coupon!.code,
              type: validation.coupon!.type,
              value: validation.coupon!.value,
              minimumPurchaseAmount: validation.coupon!.minimumPurchaseAmount
            }
          }
        };
      } catch (error) {
        throw fastify.httpErrors.notFound('Failed to validate coupon');
      }
    }
  });
} 