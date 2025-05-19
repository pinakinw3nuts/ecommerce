import { FastifyInstance } from 'fastify';
import { categoryController } from '../controllers/category.controller';

export async function categoryRoutes(fastify: FastifyInstance) {
  // Register only public routes if we're not in the protected context
  if (!fastify.hasDecorator('auth')) {
    await categoryController.registerPublicRoutes(fastify);
  } else {
    // Register only protected routes if we're in the protected context
    await categoryController.registerProtectedRoutes(fastify);
  }
} 