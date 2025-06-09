import { FastifyInstance } from 'fastify';
import { WidgetController } from '../controllers/widget.controller';

// Define schemas for widget routes
const widgetResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    type: { type: 'string' },
    content: { type: 'object', additionalProperties: true },
    position: { type: 'string' },
    isActive: { type: 'boolean' },
    sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const createWidgetSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    type: { type: 'string' },
    content: { type: 'object', additionalProperties: true },
    position: { type: 'string' },
    isActive: { type: 'boolean' },
    sortOrder: { type: 'integer' }
  }
};

/**
 * Widget routes for managing widgets
 */
export async function widgetRoutes(fastify: FastifyInstance) {
  const widgetController = new WidgetController();

  // Get home page content
  fastify.get(
    '/home',
    {
      schema: {
        tags: ['Widget'],
        summary: 'Get home page content',
        description: 'Retrieve content for the home page',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object', additionalProperties: true }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    widgetController.getHomeContent
  );

  // Test route
  fastify.get(
    '/test',
    {
      schema: {
        tags: ['Widget'],
        summary: 'Test widget route',
        description: 'Test route to verify widget routing works',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      return reply.send({ success: true, message: 'Widget test route works!' });
    }
  );

  // Get all widgets
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Widget'],
        summary: 'Get all widgets',
        description: 'Retrieve all widgets',
        response: {
          200: {
            type: 'array',
            items: widgetResponseSchema
          }
        }
      }
    },
    async (_request, reply) => {
      // Mock response
      return reply.send([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Featured Products',
          type: 'product-list',
          position: 'home-page',
          isActive: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Hero Banner',
          type: 'banner',
          position: 'home-page',
          isActive: true,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  );

  // Get widget by ID
  fastify.get<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['Widget'],
        summary: 'Get widget by ID',
        description: 'Retrieve a specific widget by its ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: widgetResponseSchema,
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      // Mock response
      return reply.send({
        id,
        name: `Widget ${id}`,
        type: 'generic',
        position: 'sidebar',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  );

  // Create widget
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Widget'],
        summary: 'Create a new widget',
        description: 'Create a new widget with the provided details',
        body: createWidgetSchema,
        response: {
          201: widgetResponseSchema,
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // Mock response
      const widgetData = request.body as any;
      return reply.status(201).send({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...widgetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  );
} 