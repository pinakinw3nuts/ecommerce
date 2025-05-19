import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BundleService } from '../services/bundle.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const bundleService = new BundleService();

const bundleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  discountPercentage: z.number().optional(),
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  stockQuantity: z.number().optional(),
  metadata: z.object({
    thumbnail: z.string().optional(),
    savings: z.number().optional(),
    originalPrice: z.number().optional()
  }).optional(),
  productIds: z.array(z.string())
});

export const bundleController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/bundles', {
      schema: {
        tags: ['bundles'],
        summary: 'List all bundles',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            isActive: { type: 'boolean' },
            includeExpired: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductBundle' }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          skip?: number;
          take?: number;
          isActive?: boolean;
          includeExpired?: boolean;
        }
      }>, reply) => {
        const bundles = await bundleService.listBundles(request.query);
        return reply.send(bundles);
      }
    });

    fastify.get('/bundles/:id', {
      schema: {
        tags: ['bundles'],
        summary: 'Get a bundle by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Bundle ID' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/ProductBundle' },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const bundle = await bundleService.getBundleById(request.params.id);
        if (!bundle) {
          return reply.code(404).send({ message: 'Bundle not found' });
        }
        return reply.send(bundle);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/bundles', {
      schema: {
        tags: ['bundles'],
        summary: 'Create a new bundle',
        body: {
          type: 'object',
          required: ['name', 'price', 'productIds'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            discountPercentage: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            stockQuantity: { type: 'number' },
            metadata: {
              type: 'object',
              properties: {
                thumbnail: { type: 'string' },
                savings: { type: 'number' },
                originalPrice: { type: 'number' }
              }
            },
            productIds: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        response: {
          201: { $ref: '#/components/schemas/ProductBundle' }
        }
      },
      preHandler: validateRequest(bundleSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof bundleSchema> }>, reply) => {
        const bundle = await bundleService.createBundle(request.body);
        return reply.code(201).send(bundle);
      }
    });

    fastify.put('/bundles/:id', {
      schema: {
        tags: ['bundles'],
        summary: 'Update a bundle',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Bundle ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            discountPercentage: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            stockQuantity: { type: 'number' },
            metadata: {
              type: 'object',
              properties: {
                thumbnail: { type: 'string' },
                savings: { type: 'number' },
                originalPrice: { type: 'number' }
              }
            },
            productIds: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/ProductBundle' },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(bundleSchema.partial()),
      handler: async (request: FastifyRequest<{ Params: { id: string }, Body: Partial<z.infer<typeof bundleSchema>> }>, reply) => {
        try {
          const bundle = await bundleService.updateBundle(request.params.id, request.body);
          return reply.send(bundle);
        } catch (error) {
          return reply.code(404).send({ message: 'Bundle not found' });
        }
      }
    });

    fastify.delete('/bundles/:id', {
      schema: {
        tags: ['bundles'],
        summary: 'Delete a bundle',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Bundle ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Bundle deleted successfully'
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
          await bundleService.deleteBundle(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Bundle not found' });
        }
      }
    });

    fastify.post('/bundles/:id/products/:productId', {
      schema: {
        tags: ['bundles'],
        summary: 'Add a product to a bundle',
        params: {
          type: 'object',
          required: ['id', 'productId'],
          properties: {
            id: { type: 'string', description: 'Bundle ID' },
            productId: { type: 'string', description: 'Product ID' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/ProductBundle' },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string; productId: string } }>, reply) => {
        try {
          const bundle = await bundleService.addProductToBundle(request.params.id, request.params.productId);
          return reply.send(bundle);
        } catch (error) {
          return reply.code(404).send({ message: 'Bundle or product not found' });
        }
      }
    });

    fastify.delete('/bundles/:id/products/:productId', {
      schema: {
        tags: ['bundles'],
        summary: 'Remove a product from a bundle',
        params: {
          type: 'object',
          required: ['id', 'productId'],
          properties: {
            id: { type: 'string', description: 'Bundle ID' },
            productId: { type: 'string', description: 'Product ID' }
          }
        },
        response: {
          200: { $ref: '#/components/schemas/ProductBundle' },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string; productId: string } }>, reply) => {
        try {
          const bundle = await bundleService.removeProductFromBundle(request.params.id, request.params.productId);
          return reply.send(bundle);
        } catch (error) {
          return reply.code(404).send({ message: 'Bundle or product not found' });
        }
      }
    });
  }
}; 