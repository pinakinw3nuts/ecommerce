import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fp from 'fastify-plugin';
import fastifySensible from '@fastify/sensible';
import { CouponService } from '../../services/coupon.service';
import { authGuard } from '../../middleware/auth.guard';
import { roleGuard } from '../../middleware/role.guard';
import { Coupon, CouponType } from '../../entities/Coupon';

interface CouponPluginOptions {
  couponService: CouponService;
}

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
          message: 'Percentage value must be between 0 and 100',
          path: ['value']
        });
        return false;
      }
      return true;
    }),
  expiresAt: z.string()
    .datetime()
    .nullable()
    .optional()
    .transform(val => val ? new Date(val) : null),
  maxUses: z.number()
    .int()
    .positive()
    .nullable()
    .optional(),
  minimumPurchaseAmount: z.number()
    .positive()
    .nullable()
    .optional(),
  applicableProducts: z.array(z.string())
    .nullable()
    .optional(),
  isActive: z.boolean()
    .default(true)
});

const updateCouponSchema = createCouponSchema
  .partial()
  .extend({
    id: z.string().uuid()
  });

const listCouponsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  isActive: z.boolean().optional(),
  type: z.enum([CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT]).optional()
});

export default fp(async function adminCouponRoutes(
  fastify: FastifyInstance,
  opts: CouponPluginOptions
) {
  await fastify.register(fastifySensible);
  const { couponService } = opts;

  // Add authentication and role guards for all routes
  fastify.addHook('preHandler', authGuard);
  fastify.addHook('preHandler', roleGuard('admin'));

  // Create coupon
  fastify.post<{ Body: z.infer<typeof createCouponSchema> }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['code', 'type', 'value'],
          properties: {
            code: { type: 'string', minLength: 3, maxLength: 50 },
            type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
            value: { type: 'number', minimum: 0 },
            expiresAt: { type: 'string', format: 'date-time' },
            maxUses: { type: 'number', minimum: 1 },
            minimumPurchaseAmount: { type: 'number', minimum: 0 },
            applicableProducts: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' }
          }
        }
      }
    },
    async (request) => {
      const couponData = createCouponSchema.parse(request.body);

      // Check if coupon code already exists
      const existingCoupon = await couponService.findByCode(couponData.code);
      if (existingCoupon) {
        throw fastify.httpErrors.conflict('Coupon code already exists');
      }

      const createData = {
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        isActive: couponData.isActive,
        expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
        ...(couponData.maxUses !== undefined && { maxUses: couponData.maxUses }),
        ...(couponData.minimumPurchaseAmount !== undefined && { minimumPurchaseAmount: couponData.minimumPurchaseAmount }),
        ...(couponData.applicableProducts !== undefined && { applicableProducts: couponData.applicableProducts })
      };

      const coupon = await couponService.create(createData);

      return {
        success: true,
        data: coupon
      };
    }
  );

  // List coupons with pagination and filters
  fastify.get<{ Querystring: z.infer<typeof listCouponsSchema> }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            isActive: { type: 'boolean' },
            type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] }
          }
        }
      }
    },
    async (request) => {
      const { page, limit, isActive, type } = listCouponsSchema.parse(request.query);
      
      const [coupons, total] = await couponService.findAll({
        page,
        limit,
        ...(isActive !== undefined && { isActive }),
        ...(type !== undefined && { type })
      });

      return {
        success: true,
        data: {
          items: coupons,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    }
  );

  // Get coupon by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      }
    },
    async (request) => {
      const coupon = await couponService.findById(request.params.id);
      
      if (!coupon) {
        throw fastify.httpErrors.notFound('Coupon not found');
      }

      return {
        success: true,
        data: coupon
      };
    }
  );

  // Update coupon
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateCouponSchema> }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          properties: {
            code: { type: 'string', minLength: 3, maxLength: 50 },
            type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
            value: { type: 'number', minimum: 0 },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            maxUses: { type: 'number', minimum: 1, nullable: true },
            minimumPurchaseAmount: { type: 'number', minimum: 0, nullable: true },
            applicableProducts: { type: 'array', items: { type: 'string' }, nullable: true },
            isActive: { type: 'boolean' }
          }
        }
      }
    },
    async (request) => {
      const couponData = updateCouponSchema.parse({
        ...request.body,
        id: request.params.id
      });

      // Check if coupon exists
      const existingCoupon = await couponService.findById(couponData.id);
      if (!existingCoupon) {
        throw fastify.httpErrors.notFound('Coupon not found');
      }

      // Check if new code conflicts with existing one
      if (couponData.code && couponData.code !== existingCoupon.code) {
        const codeExists = await couponService.findByCode(couponData.code);
        if (codeExists) {
          throw fastify.httpErrors.conflict('Coupon code already exists');
        }
      }

      const { id, ...rawUpdateData } = couponData;
      const updateData = Object.entries(rawUpdateData)
        .filter(([_, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
          if (key === 'expiresAt' && typeof value === 'string') {
            return { ...acc, [key]: new Date(value) };
          }
          return { ...acc, [key]: value };
        }, {} as Partial<Coupon>);

      const updatedCoupon = await couponService.update(id, updateData);

      return {
        success: true,
        data: updatedCoupon
      };
    }
  );

  // Delete coupon
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      }
    },
    async (request) => {
      const coupon = await couponService.findById(request.params.id);
      
      if (!coupon) {
        throw fastify.httpErrors.notFound('Coupon not found');
      }

      await couponService.delete(request.params.id);

      return {
        success: true,
        message: 'Coupon deleted successfully'
      };
    }
  );
}); 