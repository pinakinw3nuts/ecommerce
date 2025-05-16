import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';

const roleLogger = logger.child({ module: 'role-guard' });

type RoleCheckFunction = (userRoles: string[]) => boolean;

export interface RoleGuardOptions {
  /**
   * Array of roles that are allowed to access the route
   * User must have at least one of these roles
   */
  anyOf?: string[];

  /**
   * Array of roles that the user must all have to access the route
   */
  allOf?: string[];

  /**
   * Custom function to check roles with complex logic
   */
  check?: RoleCheckFunction;

  /**
   * If true, will allow access if user has admin role regardless of other conditions
   * @default true
   */
  adminOverride?: boolean;
}

/**
 * Extracts roles from the user object in request
 * Handles both string and array role formats
 */
const extractUserRoles = (request: FastifyRequest): string[] => {
  const userRole = request.user?.role;
  
  if (!userRole) {
    return [];
  }

  return Array.isArray(userRole) ? userRole : [userRole];
};

/**
 * Creates a role guard middleware with specified options
 */
export const roleGuard = (options: RoleGuardOptions) => {
  const {
    anyOf = [],
    allOf = [],
    check,
    adminOverride = true
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Ensure user is authenticated
      if (!request.user) {
        roleLogger.warn('Unauthenticated user attempted to access protected route');
        return reply.status(401).send({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const userRoles = extractUserRoles(request);

      // Admin override check
      if (adminOverride && userRoles.includes('admin')) {
        roleLogger.debug({ userId: request.user.userId }, 'Admin access granted');
        return;
      }

      let hasAccess = true;

      // Check if user has any of the required roles
      if (anyOf.length > 0) {
        hasAccess = anyOf.some(role => userRoles.includes(role));
        if (!hasAccess) {
          roleLogger.warn({
            userId: request.user.userId,
            userRoles,
            requiredRoles: anyOf
          }, 'User lacks any required role');
        }
      }

      // Check if user has all required roles
      if (hasAccess && allOf.length > 0) {
        hasAccess = allOf.every(role => userRoles.includes(role));
        if (!hasAccess) {
          roleLogger.warn({
            userId: request.user.userId,
            userRoles,
            requiredRoles: allOf
          }, 'User lacks all required roles');
        }
      }

      // Run custom role check if provided
      if (hasAccess && check) {
        hasAccess = check(userRoles);
        if (!hasAccess) {
          roleLogger.warn({
            userId: request.user.userId,
            userRoles
          }, 'Custom role check failed');
        }
      }

      if (!hasAccess) {
        return reply.status(403).send({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      roleLogger.debug({
        userId: request.user.userId,
        userRoles
      }, 'Role check passed successfully');

    } catch (error) {
      roleLogger.error({ error }, 'Error processing role check');
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error during role verification'
      });
    }
  };
};

// Preset role guard configurations
export const commonRoleGuards = {
  /**
   * Requires user to have admin role
   */
  adminOnly: roleGuard({ anyOf: ['admin'] }),

  /**
   * Allows access to both admin and manager roles
   */
  managementOnly: roleGuard({ anyOf: ['admin', 'manager'] }),

  /**
   * Requires user to have both seller and verified roles
   */
  verifiedSeller: roleGuard({ allOf: ['seller', 'verified'] }),

  /**
   * Custom guard for customer service roles
   */
  customerService: roleGuard({
    anyOf: ['support', 'customer_service'],
    adminOverride: false // Don't allow admin override for customer service
  }),

  /**
   * Complex role check example
   */
  complexCheck: roleGuard({
    check: (roles) => {
      // Example: Must be a verified seller with either support or manager role
      const isVerifiedSeller = roles.includes('seller') && roles.includes('verified');
      const hasSupportRole = roles.includes('support') || roles.includes('manager');
      return isVerifiedSeller && hasSupportRole;
    }
  })
}; 