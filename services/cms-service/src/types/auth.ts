import { FastifyRequest } from 'fastify';
import { JwtUser } from '../middleware/authGuard';

/**
 * Interface for requests that have been authenticated
 * Extends the base Request with authenticated user data
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtUser;
}

/**
 * User roles for authorization
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  VIEWER = 'viewer'
}

/**
 * Check if a user has a specific role
 * @param user - The user object
 * @param role - The role to check
 * @returns True if the user has the specified role
 */
export function hasRole(user: JwtUser, role: UserRole): boolean {
  return user.roles.includes(role);
}

/**
 * Check if a user has any of the specified roles
 * @param user - The user object
 * @param roles - Array of roles to check
 * @returns True if the user has any of the specified roles
 */
export function hasAnyRole(user: JwtUser, roles: UserRole[]): boolean {
  return roles.some(role => user.roles.includes(role));
} 