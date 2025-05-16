import { FastifyInstance, FastifyBaseLogger, RawServerDefault } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';

// Define swagger schemas outside the route registration
const swaggerTags = [
  {
    name: 'Authentication',
    description: 'Authentication related endpoints'
  }
];

const swaggerSchemas = {
  SignupRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      name: { type: 'string', minLength: 2 }
    }
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    }
  },
  GoogleLoginRequest: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: { type: 'string' }
    }
  },
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  AuthResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          isEmailVerified: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' }
    }
  },
  TokenResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['error'] },
      message: { type: 'string' }
    }
  }
};

export async function registerAuthRoutes(
  server: FastifyInstance<RawServerDefault, any, any, FastifyBaseLogger>,
  dataSource: DataSource
): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  await authController.register(server);

  // Add schemas to swagger documentation
  for (const [schemaName, schema] of Object.entries(swaggerSchemas)) {
    server.addSchema({
      $id: `auth_${schemaName}`,
      ...schema
    });
  }

  // Register route documentation
  const authRoutesSchema = {
    '/auth/signup': {
      post: {
        tags: swaggerTags.map(tag => tag.name),
        summary: 'Register a new user',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: 'auth_SignupRequest#' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: 'auth_AuthResponse#' }
              }
            }
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: 'auth_ErrorResponse#' }
              }
            }
          }
        }
      }
    }
  };

  // Register the route schemas with Swagger
  if (typeof server.swagger !== 'undefined') {
    // Add schemas to swagger documentation
    for (const [path, pathSchema] of Object.entries(authRoutesSchema)) {
      server.route({
        method: 'POST',
        url: path,
        schema: pathSchema.post,
        handler: async () => {} // This will be overridden by the controller
      });
    }
  }
} 