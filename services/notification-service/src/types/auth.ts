import { FastifyRequest, RouteGenericInterface } from 'fastify';

/**
 * User object structure from JWT token
 */
export interface AuthUser {
  id: string;
  roles?: string[];
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Extended FastifyRequest with authenticated user
 */
export type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = 
  FastifyRequest<T> & {
    user: AuthUser;
  }; 