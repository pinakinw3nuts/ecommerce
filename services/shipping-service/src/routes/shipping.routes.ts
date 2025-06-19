import fastify from 'fastify';
import { z } from 'zod';
import { ShippingController } from '../controllers/shipping.controller';
import { validateRequest } from '../middlewares/validateRequest';

// Type definitions for Fastify
type FastifyInstance = any;

// Validation schemas
const etaCalculationSchema = z.object({
  pincode: z.string().min(5, 'Valid pincode is required'),
  methodId: z.string().uuid('Invalid shipping method ID format').optional(),
  methodCode: z.string().optional(),
  weight: z.number().optional(),
  orderValue: z.number().optional(),
  productCategories: z.array(z.string()).optional(),
  customerGroup: z.string().optional()
}).refine((data: any) => data.methodId || data.methodCode, {
  message: 'Either methodId or methodCode must be provided',
  path: ['methodId']
});

const availableMethodsQuerySchema = z.object({
  pincode: z.string().min(5, 'Valid pincode is required'),
  weight: z.number().optional(),
  orderValue: z.number().optional(),
  productCategories: z.array(z.string()).optional(),
  customerGroup: z.string().optional()
});

/**
 * Register shipping routes
 * @param fastify - Fastify instance
 */
export async function shippingRoutes(fastify: FastifyInstance) {
  const shippingController = new ShippingController();
  await shippingController.registerRoutes(fastify);
  await shippingController.registerAdminRoutes(fastify);
} 