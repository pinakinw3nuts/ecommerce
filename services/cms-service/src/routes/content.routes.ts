import { FastifyInstance } from 'fastify';
import { ContentController } from '../controllers/content.controller';

/**
 * Content routes for managing content blocks
 */
export async function contentRoutes(fastify: FastifyInstance) {
  // Check if we're in a protected context (has auth decorator)
  const isProtected = fastify.hasDecorator('auth');
  
  if (isProtected) {
    // Register only protected routes if we're in the protected context
    await ContentController.registerProtectedRoutes(fastify);
  } else {
    // Register only public routes if we're not in the protected context
    await ContentController.registerPublicRoutes(fastify);
  }
} 