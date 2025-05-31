import { FastifyInstance } from 'fastify';
import { ModerationController } from '../controllers/moderation.controller';
import { authGuard, JwtPayload } from '../middleware/authGuard';
import { authLogger } from '../utils/logger';
import { RouteGenericInterface } from 'fastify/types/route';
import { FastifyRequest, FastifyReply } from 'fastify';

// Define authenticated request type with user property
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
};

/**
 * Role-based access control middleware
 * @param role Required role to access the route
 */
export function roleGuard(role: string) {
  return async (request: any, reply: any) => {
    const user = request.user;
    
    if (!user || !user.roles || !user.roles.includes(role)) {
      authLogger.warn({ 
        userId: user?.id,
        requiredRole: role,
        userRoles: user?.roles 
      }, 'Access denied: insufficient permissions');
      
      return reply.status(403).send({ 
        message: `Access denied: ${role} role required` 
      });
    }
  };
}

/**
 * Moderation routes plugin
 * Registers all admin-only routes for review moderation
 */
export async function moderationRoutes(fastify: FastifyInstance) {
  const moderationController = new ModerationController();

  // Log route registration
  authLogger.info('Registering moderation routes');

  // Register admin-only routes with prefix
  fastify.register(async (adminRoutes) => {
    // Apply authentication to all routes in this plugin
    adminRoutes.addHook('onRequest', authGuard);
    
    // Apply admin role check to all routes in this plugin
    adminRoutes.addHook('onRequest', roleGuard('admin'));
    
    // Hide a review (unpublish)
    adminRoutes.put<{
      Params: { id: string };
      Body: {
        reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
        comment?: string;
      };
    }>('/reviews/:id/hide', {
      schema: {
        tags: ['Moderation'],
        summary: 'Hide a review',
        description: 'Hide/unpublish a review. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { 
              type: 'string',
              enum: [
                'INAPPROPRIATE_CONTENT',
                'SPAM',
                'FAKE_REVIEW',
                'POLICY_VIOLATION',
                'USER_REQUESTED',
                'OTHER'
              ]
            },
            comment: { type: 'string', maxLength: 500 }
          }
        },
        response: {
          200: {
            description: 'Review hidden successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              isPublished: { type: 'boolean' },
              metadata: { 
                type: 'object',
                properties: {
                  moderation: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      reason: { type: 'string' },
                      adminId: { type: 'string', format: 'uuid' }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden - Admin access required',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Review not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        // Using a type assertion for the specific shape expected by the controller
        const authRequest = request as unknown as AuthenticatedRequest<{
          Params: { id: string };
          Body: {
            reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
            comment?: string;
          };
        }>;
        return moderationController.hideReview(authRequest, reply);
      }
    });

    // Publish a review
    adminRoutes.put<{
      Params: { id: string };
      Body: {
        reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
        comment?: string;
      };
    }>('/reviews/:id/publish', {
      schema: {
        tags: ['Moderation'],
        summary: 'Publish a review',
        description: 'Publish/restore a previously hidden review. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { 
              type: 'string',
              enum: [
                'INAPPROPRIATE_CONTENT',
                'SPAM',
                'FAKE_REVIEW',
                'POLICY_VIOLATION',
                'USER_REQUESTED',
                'OTHER'
              ]
            },
            comment: { type: 'string', maxLength: 500 }
          }
        },
        response: {
          200: {
            description: 'Review published successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              isPublished: { type: 'boolean' },
              metadata: { 
                type: 'object',
                properties: {
                  moderation: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      reason: { type: 'string' },
                      adminId: { type: 'string', format: 'uuid' }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden - Admin access required',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Review not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        // Using a type assertion for the specific shape expected by the controller
        const authRequest = request as unknown as AuthenticatedRequest<{
          Params: { id: string };
          Body: {
            reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
            comment?: string;
          };
        }>;
        return moderationController.publishReview(authRequest, reply);
      }
    });

    // Delete a review (admin)
    adminRoutes.delete<{
      Params: { id: string };
      Body: {
        reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
        comment?: string;
      };
    }>('/reviews/:id', {
      schema: {
        tags: ['Moderation'],
        summary: 'Delete a review (admin)',
        description: 'Permanently delete a review. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { 
              type: 'string',
              enum: [
                'INAPPROPRIATE_CONTENT',
                'SPAM',
                'FAKE_REVIEW',
                'POLICY_VIOLATION',
                'USER_REQUESTED',
                'OTHER'
              ]
            },
            comment: { type: 'string', maxLength: 500 }
          }
        },
        response: {
          204: {
            description: 'Review deleted successfully',
            type: 'null'
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden - Admin access required',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Review not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        // Using a type assertion for the specific shape expected by the controller
        const authRequest = request as unknown as AuthenticatedRequest<{
          Params: { id: string };
          Body: {
            reason: 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'FAKE_REVIEW' | 'POLICY_VIOLATION' | 'USER_REQUESTED' | 'OTHER';
            comment?: string;
          };
        }>;
        return moderationController.deleteReview(authRequest, reply);
      }
    });

    // Get flagged reviews
    adminRoutes.get<{
      Querystring: {
        page?: number;
        limit?: number;
      };
    }>('/reviews/flagged', {
      schema: {
        tags: ['Moderation'],
        summary: 'Get flagged reviews',
        description: 'Get reviews that have been flagged for moderation. Admin access required.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          }
        },
        response: {
          200: {
            description: 'List of flagged reviews',
            type: 'object',
            properties: {
              reviews: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    productId: { type: 'string', format: 'uuid' },
                    rating: { type: 'integer' },
                    comment: { type: 'string' },
                    isPublished: { type: 'boolean' },
                    isVerifiedPurchase: { type: 'boolean' },
                    metadata: { 
                      type: 'object',
                      properties: {
                        reports: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              timestamp: { type: 'string', format: 'date-time' },
                              reason: { type: 'string' },
                              reporterId: { type: 'string' }
                            }
                          }
                        }
                      }
                    },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  pages: { type: 'integer' }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden - Admin access required',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        // The getFlaggedReviews expects the query params to be non-optional
        // Apply defaults if they're not provided
        const enhancedRequest = {
          ...request,
          query: {
            page: request.query.page ?? 1,
            limit: request.query.limit ?? 20
          }
        };
        
        // Using a type assertion for the specific shape expected by the controller
        const authRequest = enhancedRequest as unknown as AuthenticatedRequest<{
          Querystring: { page: number; limit: number }
        }>;
        return moderationController.getFlaggedReviews(authRequest, reply);
      }
    });
  }, { prefix: '/admin' });
} 