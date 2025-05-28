import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TagService } from '../services/tag.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const tagService = new TagService();

const tagSchema = z.object({
  name: z.string(),
  slug: z.string().optional()
});

export const tagController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['tags'],
        summary: 'List all tags',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            search: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          skip?: number;
          take?: number;
          search?: string;
        }
      }>, reply) => {
        const tags = await tagService.listTags(request.query);
        return reply.send(tags);
      }
    });

    fastify.get('/:id', {
      schema: {
        tags: ['tags'],
        summary: 'Get a tag by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Tag ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
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
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const tag = await tagService.getTagById(request.params.id);
        if (!tag) {
          return reply.code(404).send({ message: 'Tag not found' });
        }
        return reply.send(tag);
      }
    });

    fastify.get('/:id/products', {
      schema: {
        tags: ['tags'],
        summary: 'Get products by tag ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Tag ID' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                mediaUrl: { type: 'string' }
              }
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
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Querystring: { skip?: number; take?: number };
      }>, reply) => {
        const products = await tagService.getTagProducts(request.params.id, request.query);
        return reply.send(products);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['tags'],
        summary: 'Create a new tag',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(tagSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof tagSchema> }>, reply) => {
        const tag = await tagService.createTag(request.body);
        return reply.code(201).send(tag);
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['tags'],
        summary: 'Update a tag',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Tag ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
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
      preHandler: validateRequest(tagSchema.partial()),
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<z.infer<typeof tagSchema>>;
      }>, reply) => {
        try {
          const tag = await tagService.updateTag(request.params.id, request.body);
          return reply.send(tag);
        } catch (error) {
          return reply.code(404).send({ message: 'Tag not found' });
        }
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['tags'],
        summary: 'Delete a tag',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Tag ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Tag deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        try {
          await tagService.deleteTag(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Tag not found' });
        }
      }
    });
  }
}; 