import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fp from 'fastify-plugin';
import fastifySensible from '@fastify/sensible';
import { CouponService } from '../../services/coupon.service';
import { authGuard } from '../../middleware/auth.guard';
import { roleGuard } from '../../middleware/role.guard';
import { CouponType } from '../../entities/Coupon';

interface CouponPluginOptions {
  couponService: CouponService;
}

// JSON Schema for Coupon
const couponJsonSchema = {
  type: 'object',
  required: ['id', 'code', 'type', 'value', 'isActive'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string', minLength: 3, maxLength: 50 },
    type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
    value: { type: 'number', minimum: 0 },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    maxUses: { type: 'integer', minimum: 1, nullable: true },
    minimumPurchaseAmount: { type: 'number', minimum: 0, nullable: true },
    applicableProducts: {
      type: 'array',
      items: { type: 'string' },
      nullable: true
    },
    isActive: { type: 'boolean' },
    usageCount: { type: 'integer', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

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
    .nullable()
    .optional(),
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

  // Register schemas
  fastify.addSchema({
    $id: 'coupon',
    ...couponJsonSchema
  });

  // Add authentication and role guards for all routes
  fastify.addHook('preHandler', authGuard);
  fastify.addHook('preHandler', roleGuard('admin'));

  // Create coupon
  fastify.post('/', {
    schema: {
      description: 'Create a new coupon',
      tags: ['coupons'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['code', 'type', 'value'],
        properties: {
          code: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[A-Z0-9_-]+$' },
          type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
          value: { type: 'number', minimum: 0 },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          maxUses: { type: 'integer', minimum: 1, nullable: true },
          minimumPurchaseAmount: { type: 'number', minimum: 0, nullable: true },
          applicableProducts: { 
            type: 'array', 
            items: { type: 'string' },
            nullable: true 
          },
          isActive: { type: 'boolean', default: true }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: couponJsonSchema
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
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
      const couponData = createCouponSchema.parse(request.body);

      // Check if coupon code already exists
      const existingCoupon = await couponService.findByCode(couponData.code);
      if (existingCoupon) {
        throw fastify.httpErrors.conflict('Coupon code already exists');
      }

      // Transform data for database
      const createData = {
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        isActive: couponData.isActive,
        expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
        ...(couponData.maxUses !== undefined && { maxUses: couponData.maxUses }),
        ...(couponData.minimumPurchaseAmount !== undefined && { 
          minimumPurchaseAmount: couponData.minimumPurchaseAmount 
        }),
        ...(couponData.applicableProducts !== undefined && { 
          applicableProducts: couponData.applicableProducts 
        })
      };

      const coupon = await couponService.create(createData);

      return {
        success: true,
        data: coupon
      };
    }
  });

  // List coupons with pagination and filters
  fastify.get('/', {
    schema: {
      description: 'List all coupons with pagination and filters',
      tags: ['coupons'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          isActive: { type: 'boolean' },
          type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] }
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
                items: {
                  type: 'array',
                  items: couponJsonSchema
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request) => {
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
  });

  // Get coupon by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      description: 'Get a coupon by ID',
      tags: ['coupons'],
      security: [{ bearerAuth: [] }],
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
            data: couponJsonSchema
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
    handler: async (request) => {
      const { id } = request.params;
      const coupon = await couponService.findById(id);
      
      if (!coupon) {
        throw fastify.httpErrors.notFound('Coupon not found');
      }

      return {
        success: true,
        data: coupon
      };
    }
  });

  // Update coupon
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateCouponSchema> }>('/:id', {
    schema: {
      description: 'Update a coupon',
      tags: ['coupons'],
      security: [{ bearerAuth: [] }],
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
          code: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[A-Z0-9_-]+$' },
          type: { type: 'string', enum: [CouponType.PERCENTAGE, CouponType.FIXED_AMOUNT] },
          value: { type: 'number', minimum: 0 },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          maxUses: { type: 'integer', minimum: 1, nullable: true },
          minimumPurchaseAmount: { type: 'number', minimum: 0, nullable: true },
          applicableProducts: { 
            type: 'array', 
            items: { type: 'string' },
            nullable: true 
          },
          isActive: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: couponJsonSchema
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
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
      const { id } = request.params;
      const couponData = updateCouponSchema.parse({
        ...request.body,
        id
      });

      // Check if coupon exists
      const existingCoupon = await couponService.findById(id);
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

      // Transform data for database
      const updateData = {
        ...(couponData.code && { code: couponData.code }),
        ...(couponData.type && { type: couponData.type }),
        ...(couponData.value && { value: couponData.value }),
        ...(couponData.isActive !== undefined && { isActive: couponData.isActive }),
        ...(couponData.expiresAt !== undefined && { 
          expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null 
        }),
        ...(couponData.maxUses !== undefined && { maxUses: couponData.maxUses }),
        ...(couponData.minimumPurchaseAmount !== undefined && { 
          minimumPurchaseAmount: couponData.minimumPurchaseAmount 
        }),
        ...(couponData.applicableProducts !== undefined && { 
          applicableProducts: couponData.applicableProducts 
        })
      };

      const updatedCoupon = await couponService.update(id, updateData);

      return {
        success: true,
        data: updatedCoupon
      };
    }
  });

  // Delete coupon
  fastify.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      description: 'Delete a coupon',
      tags: ['coupons'],
      security: [{ bearerAuth: [] }],
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
            message: { type: 'string' }
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
    handler: async (request) => {
      const { id } = request.params;
      const coupon = await couponService.findById(id);
      
      if (!coupon) {
        throw fastify.httpErrors.notFound('Coupon not found');
      }

      await couponService.delete(id);

      return {
        success: true,
        message: 'Coupon deleted successfully'
      };
    }
  });
}); 