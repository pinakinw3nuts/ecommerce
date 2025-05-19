import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CouponService } from '../services/coupon.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const couponService = new CouponService();

const couponSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  discountAmount: z.number().positive(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  minimumPurchaseAmount: z.number().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  isFirstPurchaseOnly: z.boolean().optional(),
  productIds: z.array(z.string()).optional()
});

const validateCouponSchema = z.object({
  code: z.string(),
  userId: z.string(),
  totalAmount: z.number().positive(),
  productIds: z.array(z.string())
});

export const couponController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['coupons'],
        summary: 'List all coupons',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            isActive: { type: 'boolean' },
            includeExpired: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                discountAmount: { type: 'number' },
                discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' },
                minimumPurchaseAmount: { type: 'number' },
                usageLimit: { type: 'number' },
                usageCount: { type: 'number' },
                perUserLimit: { type: 'number' },
                isFirstPurchaseOnly: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          skip?: number;
          take?: number;
          isActive?: boolean;
          includeExpired?: boolean;
        }
      }>, reply) => {
        // console.log('GET /coupons - Query params:', request.query);
        const coupons = await couponService.listCoupons(request.query);
        // console.log('GET /coupons - Found coupons:', coupons);
        return reply.send(coupons);
      }
    });

    fastify.get('/:id', {
      schema: {
        tags: ['coupons'],
        summary: 'Get a coupon by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Coupon ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              discountAmount: { type: 'number' },
              discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' },
              minimumPurchaseAmount: { type: 'number' },
              usageLimit: { type: 'number' },
              usageCount: { type: 'number' },
              perUserLimit: { type: 'number' },
              isFirstPurchaseOnly: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const coupon = await couponService.getCouponById(request.params.id);
        if (!coupon) {
          return reply.code(404).send({ message: 'Coupon not found' });
        }
        return reply.send(coupon);
      }
    });

    fastify.post('/validate', {
      schema: {
        tags: ['coupons'],
        summary: 'Validate a coupon',
        body: {
          type: 'object',
          required: ['code', 'userId', 'totalAmount', 'productIds'],
          properties: {
            code: { type: 'string' },
            userId: { type: 'string' },
            totalAmount: { type: 'number' },
            productIds: { type: 'array', items: { type: 'string' } }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              discountAmount: { type: 'number' },
              coupon: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  discountType: { type: 'string' },
                  discountAmount: { type: 'number' }
                }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(validateCouponSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof validateCouponSchema> }>, reply) => {
        try {
          const result = await couponService.validateCoupon(
            request.body.code,
            request.body.userId,
            request.body.totalAmount,
            request.body.productIds
          );
          return reply.send(result);
        } catch (error: any) {
          return reply.code(400).send({ message: error.message });
        }
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['coupons'],
        summary: 'Create a new coupon',
        body: {
          type: 'object',
          required: ['code', 'name', 'discountAmount', 'discountType', 'startDate', 'endDate'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            discountAmount: { type: 'number' },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            minimumPurchaseAmount: { type: 'number' },
            usageLimit: { type: 'number' },
            perUserLimit: { type: 'number' },
            isFirstPurchaseOnly: { type: 'boolean' },
            productIds: { type: 'array', items: { type: 'string' } }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              discountAmount: { type: 'number' },
              discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' },
              minimumPurchaseAmount: { type: 'number' },
              usageLimit: { type: 'number' },
              usageCount: { type: 'number' },
              perUserLimit: { type: 'number' },
              isFirstPurchaseOnly: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(couponSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof couponSchema> }>, reply) => {
        try {
          const coupon = await couponService.createCoupon(request.body);
          return reply.code(201).send(coupon);
        } catch (error: any) {
          return reply.code(400).send({ message: error.message });
        }
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['coupons'],
        summary: 'Update a coupon',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Coupon ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            discountAmount: { type: 'number' },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            minimumPurchaseAmount: { type: 'number' },
            usageLimit: { type: 'number' },
            perUserLimit: { type: 'number' },
            isFirstPurchaseOnly: { type: 'boolean' },
            productIds: { type: 'array', items: { type: 'string' } }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              discountAmount: { type: 'number' },
              discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' },
              minimumPurchaseAmount: { type: 'number' },
              usageLimit: { type: 'number' },
              usageCount: { type: 'number' },
              perUserLimit: { type: 'number' },
              isFirstPurchaseOnly: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(couponSchema.partial()),
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<z.infer<typeof couponSchema>>;
      }>, reply) => {
        try {
          const coupon = await couponService.updateCoupon(request.params.id, request.body);
          return reply.send(coupon);
        } catch (error: any) {
          if (error.message === 'Coupon not found') {
            return reply.code(404).send({ message: error.message });
          }
          return reply.code(400).send({ message: error.message });
        }
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['coupons'],
        summary: 'Delete a coupon',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Coupon ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Coupon deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
          await couponService.deleteCoupon(request.params.id);
          return reply.code(204).send();
        } catch (error: any) {
          return reply.code(404).send({ message: error.message });
        }
      }
    });
  }
}; 