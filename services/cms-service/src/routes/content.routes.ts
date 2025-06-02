import { FastifyInstance } from 'fastify';
import { roleGuard } from '../middleware/roleGuard';

// Define schemas for content routes
const contentBlockResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    slug: { type: 'string' },
    type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
    content: { type: 'object', additionalProperties: true },
    isPublished: { type: 'boolean' },
    publishAt: { type: 'string', format: 'date-time', nullable: true },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    metaTitle: { type: 'string', nullable: true },
    metaDescription: { type: 'string', nullable: true },
    metaKeywords: { type: 'string', nullable: true },
    ogImage: { type: 'string', nullable: true },
    metadata: { type: 'object', additionalProperties: true },
    sortOrder: { type: 'integer' },
    parentId: { type: 'string', format: 'uuid', nullable: true },
    locale: { type: 'string' },
    masterContentBlockId: { type: 'string', format: 'uuid', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const createContentBlockSchema = {
  type: 'object',
  required: ['title', 'type', 'content'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    slug: { type: 'string', minLength: 1, maxLength: 200 },
    type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
    content: { type: 'object', additionalProperties: true },
    isPublished: { type: 'boolean' },
    publishAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    metaTitle: { type: 'string', maxLength: 100 },
    metaDescription: { type: 'string', maxLength: 250 },
    metaKeywords: { type: 'string' },
    ogImage: { type: 'string' },
    metadata: { type: 'object', additionalProperties: true },
    sortOrder: { type: 'integer' },
    parentId: { type: 'string', format: 'uuid' },
    locale: { type: 'string', minLength: 2, maxLength: 10 },
    masterContentBlockId: { type: 'string', format: 'uuid' }
  }
};

const updateContentBlockSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    slug: { type: 'string', minLength: 1, maxLength: 200 },
    type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
    content: { type: 'object', additionalProperties: true },
    isPublished: { type: 'boolean' },
    publishAt: { type: 'string', format: 'date-time', nullable: true },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    metaTitle: { type: 'string', maxLength: 100, nullable: true },
    metaDescription: { type: 'string', maxLength: 250, nullable: true },
    metaKeywords: { type: 'string', nullable: true },
    ogImage: { type: 'string', nullable: true },
    metadata: { type: 'object', additionalProperties: true },
    sortOrder: { type: 'integer' },
    parentId: { type: 'string', format: 'uuid', nullable: true },
    locale: { type: 'string', minLength: 2, maxLength: 10 },
    masterContentBlockId: { type: 'string', format: 'uuid', nullable: true },
    changeDescription: { type: 'string' }
  }
};

/**
 * Content routes for managing content blocks
 */
export async function contentRoutes(fastify: FastifyInstance) {
  // Test route
  fastify.get(
    '/test',
    {
      schema: {
        tags: ['Content'],
        summary: 'Test route',
        description: 'Test route to verify routing works',
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
      return reply.send({ success: true, message: 'Content test route works!' });
    }
  );

  // Get all content blocks (admin/editor only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Content'],
        summary: 'Get all content blocks',
        description: 'Retrieve a list of all content blocks. Admin or editor access required.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: contentBlockResponseSchema
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    },
    async (_request, reply) => {
      // Mock response
      return reply.send([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Sample Content Block',
          slug: 'sample-content',
          type: 'page',
          content: { body: 'This is a sample content block' },
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  );

  // Get content block by ID
  fastify.get<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['Content'],
        summary: 'Get content block by ID',
        description: 'Retrieve a specific content block by its ID.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: contentBlockResponseSchema,
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
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
        title: `Content block ${id}`,
        slug: `content-${id}`,
        type: 'page',
        content: { body: 'This is a sample content block' },
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  );

  // Create content block
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Content'],
        summary: 'Create a new content block',
        description: 'Create a new content block with the provided details.',
        security: [{ bearerAuth: [] }],
        body: createContentBlockSchema,
        response: {
          201: contentBlockResponseSchema,
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    },
    async (request, reply) => {
      // Mock response
      const contentData = request.body as any;
      return reply.status(201).send({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...contentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  );

  // Update content block
  fastify.put<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['Content'],
        summary: 'Update a content block',
        description: 'Update an existing content block by ID.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: updateContentBlockSchema,
        response: {
          200: contentBlockResponseSchema,
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    },
    async (request, reply) => {
      const { id } = request.params;
      const updateData = request.body as any;
      // Mock response
      return reply.send({
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    }
  );

  // Delete content block
  fastify.delete<{
    Params: { id: string };
  }>(
    '/:id',
    {
      schema: {
        tags: ['Content'],
        summary: 'Delete a content block',
        description: 'Delete a content block by ID.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    },
    async (request, reply) => {
      const { id } = request.params;
      // Mock response
      return reply.send({
        success: true,
        message: `Content block ${id} deleted successfully`
      });
    }
  );
} 