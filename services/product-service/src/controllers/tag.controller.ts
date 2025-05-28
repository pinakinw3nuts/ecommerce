import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TagService } from '../services/tag.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const tagService = new TagService();

const tagSchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  isActive: z.boolean().optional().default(true)
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
            page: { type: 'string' },
            take: { type: 'string' },
            pageSize: { type: 'string' },
            search: { type: 'string' },
            isActive: { type: 'boolean' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  pageSize: { type: 'number' },
                  currentPage: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasMore: { type: 'boolean' },
                  hasPrevious: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          page?: string;
          take?: string;
          pageSize?: string;
          search?: string;
          isActive?: boolean;
          sortBy?: string;
          sortOrder?: string;
        }
      }>, reply) => {
        const { page, take, pageSize, search, isActive, sortBy, sortOrder } = request.query;
        
        // Calculate pagination parameters
        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : (take ? parseInt(take) : 10);
        const skip = (pageNum - 1) * pageSizeNum;
        
        const result = await tagService.listTags({
          skip,
          take: pageSizeNum,
          search,
          isActive,
          sortBy,
          sortOrder
        });
        
        // Build pagination response
        const totalPages = Math.ceil(result.total / pageSizeNum);
        
        return reply.send({
          tags: result.tags,
          pagination: {
            total: result.total,
            pageSize: pageSizeNum,
            currentPage: pageNum,
            totalPages,
            hasMore: result.hasMore,
            hasPrevious: pageNum > 1
          }
        });
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
              isActive: { type: 'boolean' },
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
            slug: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              isActive: { type: 'boolean' },
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
            slug: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              isActive: { type: 'boolean' },
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
    
    // Add bulk status update endpoint
    fastify.post('/bulk-status', {
      schema: {
        tags: ['tags'],
        summary: 'Update status for multiple tags',
        body: {
          type: 'object',
          required: ['tagIds', 'isActive'],
          properties: {
            tagIds: { 
              type: 'array',
              items: { type: 'string' }
            },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'number' },
              success: { type: 'boolean' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Body: {
          tagIds: string[];
          isActive: boolean;
        }
      }>, reply) => {
        const { tagIds, isActive } = request.body;
        const result = await tagService.updateTagsStatus(tagIds, isActive);
        return reply.send(result);
      }
    });
  }
}; 