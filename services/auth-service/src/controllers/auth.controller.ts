import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middlewares/validateRequest';
import { UserRole } from '../entities/user.entity';
import { RouteShorthandOptionsWithHandler } from 'fastify';
import { adminLoginRateLimit } from '../middlewares/rateLimit';
import { Redis } from 'ioredis';

// Define request schemas
const signupSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.nativeEnum(UserRole).optional()
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
};

const adminLoginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
};

const googleLoginSchema = {
  body: z.object({
    idToken: z.string()
  })
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string()
  })
};

// Define request types
interface SignupRequest {
  Body: z.infer<typeof signupSchema.body>
}

interface LoginRequest {
  Body: z.infer<typeof loginSchema.body>
}

interface GoogleLoginRequest {
  Body: z.infer<typeof googleLoginSchema.body>
}

interface RefreshTokenRequest {
  Body: z.infer<typeof refreshTokenSchema.body>
}

export class AuthController {
  private redis: Redis;

  constructor(private authService: AuthService, redis: Redis) {
    this.redis = redis;
  }

  async register(fastify: FastifyInstance) {
    // Register signup route
    fastify.post<SignupRequest>('/signup', {
      schema: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account with email and password',
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', description: 'User email address' },
            password: { type: 'string', minLength: 8, description: 'User password (minimum 8 characters)' },
            name: { type: 'string', minLength: 2, description: 'User full name' },
            role: { 
              type: 'string', 
              enum: ['ADMIN', 'USER'], 
              description: 'User role (optional, defaults to USER)' 
            }
          }
        },
        response: {
          201: { $ref: 'auth_AuthResponse#' },
          409: { $ref: 'auth_ErrorResponse#' }
        }
      },
      preHandler: validateRequest(signupSchema),
      handler: async (request: FastifyRequest<SignupRequest>, reply: FastifyReply) => {
        try {
          const user = await this.authService.signup(request.body);
          return reply.status(201).send(user);
        } catch (error) {
          if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
            return reply.status(409).send({
              status: 'error',
              message: 'Email already registered'
            });
          }
          throw error;
        }
      }
    } as RouteShorthandOptionsWithHandler);

    // Regular user login route
    fastify.post<LoginRequest>('/login', {
      schema: {
        tags: ['Authentication'],
        summary: 'Login with email and password (Regular Users)',
        description: 'Authenticate regular user with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'User email address' },
            password: { type: 'string', description: 'User password' }
          }
        },
        response: {
          200: { $ref: 'auth_AuthResponse#' },
          401: { $ref: 'auth_ErrorResponse#' }
        }
      },
      preHandler: validateRequest(loginSchema),
      handler: async (request: FastifyRequest<LoginRequest>, reply: FastifyReply) => {
        try {
          const { email, password } = request.body;
          const result = await this.authService.login(email, password, 'user');
          return reply.send(result);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message === 'INVALID_CREDENTIALS') {
              return reply.status(401).send({
                status: 'error',
                message: 'Invalid email or password'
              });
            }
            if (error.message === 'ACCOUNT_LOCKED') {
              return reply.status(423).send({
                status: 'error',
                message: 'Account is locked'
              });
            }
            if (error.message === 'INSUFFICIENT_PERMISSIONS') {
              return reply.status(403).send({
                status: 'error',
                message: 'User access required'
              });
            }
          }
          throw error;
        }
      }
    } as RouteShorthandOptionsWithHandler);

    // Admin login route
    fastify.post<LoginRequest>('/admin/login', {
      schema: {
        tags: ['Authentication'],
        summary: 'Login with email and password (Admin Only)',
        description: 'Authenticate admin user with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Admin email address' },
            password: { type: 'string', description: 'Admin password' }
          }
        },
        response: {
          200: { $ref: 'auth_AuthResponse#' },
          401: { $ref: 'auth_ErrorResponse#' },
          403: { $ref: 'auth_ErrorResponse#' },
          423: { $ref: 'auth_ErrorResponse#' },
          429: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              code: { type: 'string' },
              message: { type: 'string' },
              retryAfter: { type: 'number' }
            }
          }
        }
      },
      onRequest: [adminLoginRateLimit(this.redis)],
      preHandler: validateRequest(adminLoginSchema),
      handler: async (request: FastifyRequest<LoginRequest>, reply: FastifyReply) => {
        try {
          const { email, password } = request.body;
          const result = await this.authService.adminLogin(email, password);
          return reply.send(result);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message === 'INVALID_CREDENTIALS') {
              return reply.status(401).send({
                status: 'error',
                message: 'Invalid email or password'
              });
            }
            if (error.message === 'ACCOUNT_LOCKED') {
              return reply.status(423).send({
                status: 'error',
                message: 'Account is locked'
              });
            }
            if (error.message === 'INSUFFICIENT_PERMISSIONS') {
              return reply.status(403).send({
                status: 'error',
                message: 'Admin access required'
              });
            }
          }
          throw error;
        }
      }
    } as RouteShorthandOptionsWithHandler);

    // Register Google login route
    fastify.post<GoogleLoginRequest>('/google-login', {
      schema: {
        tags: ['Authentication'],
        summary: 'Login with Google',
        description: 'Authenticate user with Google OAuth token',
        body: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string', description: 'Google OAuth ID token' }
          }
        },
        response: {
          200: { $ref: 'auth_AuthResponse#' },
          401: { $ref: 'auth_ErrorResponse#' }
        }
      },
      preHandler: validateRequest(googleLoginSchema),
      handler: async (request: FastifyRequest<GoogleLoginRequest>, reply: FastifyReply) => {
        try {
          const result = await this.authService.googleLogin(request.body.idToken);
          return reply.send(result);
        } catch (error) {
          if (error instanceof Error && error.message === 'INVALID_TOKEN') {
            return reply.status(401).send({
              status: 'error',
              message: 'Invalid Google token'
            });
          }
          throw error;
        }
      }
    } as RouteShorthandOptionsWithHandler);

    // Register refresh token route
    fastify.post<RefreshTokenRequest>('/refresh-token', {
      schema: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Get a new access token using a refresh token',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', description: 'Refresh token to get new access token' }
          }
        },
        response: {
          200: { $ref: 'auth_TokenResponse#' },
          401: { $ref: 'auth_ErrorResponse#' }
        }
      },
      preHandler: validateRequest(refreshTokenSchema),
      handler: async (request: FastifyRequest<RefreshTokenRequest>, reply: FastifyReply) => {
        try {
          const result = await this.authService.refreshToken(request.body.refreshToken);
          return reply.send(result);
        } catch (error) {
          if (error instanceof Error && error.message === 'INVALID_TOKEN') {
            return reply.status(401).send({
              status: 'error',
              message: 'Invalid or expired refresh token'
            });
          }
          throw error;
        }
      }
    } as RouteShorthandOptionsWithHandler);
  }
} 