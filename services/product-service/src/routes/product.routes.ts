import { FastifyInstance } from 'fastify';
import { productController } from '../controllers/product.controller';

export async function productRoutes(fastify: FastifyInstance) {
  // Check if we're in a protected context (has auth decorator)
  const isProtected = fastify.hasDecorator('auth');
  
  if (isProtected) {
    // Register only protected routes if we're in the protected context
    await productController.registerProtectedRoutes(fastify);
  } else {
    // Register only public routes if we're not in the protected context
    await productController.registerPublicRoutes(fastify);
  }
} 