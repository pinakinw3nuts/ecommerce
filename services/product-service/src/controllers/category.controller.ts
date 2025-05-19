import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CategoryService } from '../services/category.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const categoryService = new CategoryService();

const categorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

interface CategoryParams {
  id: string;
}

interface CategoryBody {
  name: string;
  description?: string;
}

export const categoryController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['categories'],
        summary: 'List all categories',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const categories = await categoryService.listCategories();
        return reply.send(categories);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['categories'],
        summary: 'Create a new category',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(categorySchema),
      handler: async (request: FastifyRequest<{ Body: CategoryBody }>, reply: FastifyReply) => {
        const category = await categoryService.createCategory(request.body);
        return reply.code(201).send(category);
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['categories'],
        summary: 'Update a category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Category ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' }
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
      preHandler: validateRequest(categorySchema.partial()),
      handler: async (request: FastifyRequest<{ Params: CategoryParams, Body: Partial<CategoryBody> }>, reply: FastifyReply) => {
        const category = await categoryService.updateCategory(request.params.id, request.body);
        if (!category) {
          return reply.code(404).send({ message: 'Category not found' });
        }
        return reply.send(category);
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['categories'],
        summary: 'Delete a category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Category ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Category deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: CategoryParams }>, reply: FastifyReply) => {
        const result = await categoryService.deleteCategory(request.params.id);
        if (!result) {
          return reply.code(404).send({ message: 'Category not found' });
        }
        return reply.code(204).send();
      }
    });
  }
}; 