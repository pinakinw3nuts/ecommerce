import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middlewares/validateRequest';

// Define request schemas
const signupSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2)
  })
};

const loginSchema = {
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
  constructor(private authService: AuthService) {}

  async register(fastify: FastifyInstance) {
    // Register signup route
    fastify.post<SignupRequest>('/signup', {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 2 }
          }
        },
        response: {
          201: { $ref: 'auth_AuthResponse#' }
        }
      },
      preHandler: validateRequest(signupSchema),
      handler: async (request, reply) => {
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
    });

    // Register login route
    fastify.post<LoginRequest>('/login', {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        response: {
          200: { $ref: 'auth_AuthResponse#' }
        }
      },
      preHandler: validateRequest(loginSchema),
      handler: async (request, reply) => {
        try {
          const { email, password } = request.body;
          const result = await this.authService.login(email, password);
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
          }
          throw error;
        }
      }
    });

    // Register Google login route
    fastify.post<GoogleLoginRequest>('/google-login', {
      schema: {
        body: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string' }
          }
        },
        response: {
          200: { $ref: 'auth_AuthResponse#' }
        }
      },
      preHandler: validateRequest(googleLoginSchema),
      handler: async (request, reply) => {
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
    });

    // Register refresh token route
    fastify.post<RefreshTokenRequest>('/refresh-token', {
      schema: {
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' }
          }
        },
        response: {
          200: { $ref: 'auth_TokenResponse#' }
        }
      },
      preHandler: validateRequest(refreshTokenSchema),
      handler: async (request, reply) => {
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
    });
  }
} 