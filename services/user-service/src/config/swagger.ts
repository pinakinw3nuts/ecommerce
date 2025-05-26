import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { version } from '../../package.json';

export const swaggerOptions: SwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      description: 'RESTful API for managing users, addresses, and authentication in the e-commerce system',
      version,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com/users',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'users', description: 'User management endpoints' },
      { name: 'addresses', description: 'Address management endpoints' },
      { name: 'health', description: 'Health check endpoints' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['statusCode', 'error', 'message'],
          properties: {
            statusCode: { 
              type: 'integer',
              description: 'HTTP status code'
            },
            error: { 
              type: 'string',
              description: 'Error type'
            },
            message: { 
              type: 'string',
              description: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role', 'status'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            status: { type: 'string', enum: ['ACTIVE', 'BANNED', 'PENDING'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Address: {
          type: 'object',
          required: ['id', 'street', 'city', 'state', 'country', 'postalCode'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            postalCode: { type: 'string' },
            isDefault: { type: 'boolean' }
          }
        }
      }
    }
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next(); },
    preHandler: function (request, reply, next) { next(); }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
}; 