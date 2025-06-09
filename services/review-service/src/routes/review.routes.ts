import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ReviewController } from '../controllers/review.controller';
import { ModerationController } from '../controllers/moderation.controller';
import { authGuard, JwtPayload } from '../middlewares/authGuard';
import { apiLogger } from '../utils/logger';
import { RouteGenericInterface } from 'fastify/types/route';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

/**
 * Review routes plugin
 * Registers all review-related routes
 */
export async function reviewRoutes(fastify: FastifyInstance) {
  const reviewController = new ReviewController();

  // Log route registration
  apiLogger.info('Registering review routes');

  // Check if we're in a protected context (has auth decorator)
  const isProtected = fastify.hasDecorator('auth');
  
  if (isProtected) {
    // Register only protected routes if we're in the protected context
    await reviewController.registerProtectedRoutes(fastify);
  } else {
    // Register only public routes if we're not in the protected context
    await reviewController.registerPublicRoutes(fastify);
  }
} 