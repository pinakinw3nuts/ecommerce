import { FastifyInstance } from 'fastify';
import { productController } from '../controllers/product.controller';

export async function productRoutes(fastify: FastifyInstance) {
  // Register only public routes if we're not in the protected context
  if (!fastify.hasDecorator('auth')) {
    await productController.registerPublicRoutes(fastify);
  } else {
    // Register only protected routes if we're in the protected context
    await productController.registerProtectedRoutes(fastify);
  }
} 