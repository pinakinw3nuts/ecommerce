import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BrandService } from '../services/brand.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const brandService = new BrandService();

const brandSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().optional()
});

export const brandController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['brands'],
        summary: 'List all brands',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            isActive: { type: 'boolean' }
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
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
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
          isActive?: boolean;
        }
      }>, reply) => {
        const brands = await brandService.listBrands(request.query);
        return reply.send(brands);
      }
    });

    fastify.get('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Get a brand by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
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
        const brand = await brandService.getBrandById(request.params.id);
        if (!brand) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
        return reply.send(brand);
      }
    });

    fastify.get('/:id/products', {
      schema: {
        tags: ['brands'],
        summary: 'Get products by brand ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
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
        const products = await brandService.getBrandProducts(request.params.id, request.query);
        return reply.send(products);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['brands'],
        summary: 'Create a new brand',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(brandSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof brandSchema> }>, reply) => {
        const brand = await brandService.createBrand(request.body);
        return reply.code(201).send(brand);
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Update a brand',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
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
      preHandler: validateRequest(brandSchema.partial()),
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<z.infer<typeof brandSchema>>;
      }>, reply) => {
        try {
          const brand = await brandService.updateBrand(request.params.id, request.body);
          return reply.send(brand);
        } catch (error) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Delete a brand',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Brand deleted successfully'
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
          await brandService.deleteBrand(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
      }
    });
  }
}; 