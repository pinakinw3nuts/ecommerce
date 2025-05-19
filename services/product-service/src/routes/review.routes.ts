import { FastifyInstance } from 'fastify';
import { reviewController } from '../controllers/review.controller';

export async function reviewRoutes(fastify: FastifyInstance) {
  // Register only public routes if we're not in the protected context
  if (!fastify.hasDecorator('auth')) {
    await reviewController.registerPublicRoutes(fastify);
  } else {
    // Register only protected routes if we're in the protected context
    await reviewController.registerProtectedRoutes(fastify);
  }
} 