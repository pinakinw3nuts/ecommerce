import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import { handleFileUpload } from '../utils/fileUpload';
import { Product } from '../entities/Product';

const productService = new ProductService();

const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  mediaUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string(),
  tagIds: z.array(z.string()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    stock: z.number(),
  })).optional(),
});

interface ProductParams {
  identifier: string;
}

interface ProductBody {
  name: string;
  description: string;
  price: number;
  mediaUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  categoryId: string;
  variants?: Array<{
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
}

export const productController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['products'],
        summary: 'List all products',
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
                slug: { type: 'string' },
                mediaUrl: { type: 'string', nullable: true },
                isFeatured: { type: 'boolean' },
                isPublished: { type: 'boolean' },
                category: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true }
                  }
                },
                variants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      price: { type: 'number' },
                      stock: { type: 'number' }
                    }
                  }
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const products = await productService.listProducts();
        return reply.send(products);
      }
    });

    fastify.get('/:identifier', {
      schema: {
        tags: ['products'],
        summary: 'Get a product by ID or slug',
        params: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: { type: 'string', description: 'Product ID or slug' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              slug: { type: 'string' },
              mediaUrl: { type: 'string', nullable: true }
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
      handler: async (request: FastifyRequest<{ Params: ProductParams }>, reply) => {
        try {
          const { identifier } = request.params;
          let product: Product | null;

          // Try to find by ID first
          product = await productService.getProductById(identifier);

          // If not found by ID, try to find by slug
          if (!product) {
            const products = await productService.listProducts({ skip: 0, take: 1 });
            const foundProduct = products.find((p: Product) => p.slug === identifier);
            product = foundProduct || null;
          }

          if (!product) {
            return reply.code(404).send({ message: 'Product not found' });
          }

          return reply.send(product);
        } catch (error) {
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['products'],
        summary: 'Create a new product',
        body: {
          type: 'object',
          required: ['name', 'description', 'price', 'categoryId'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            mediaUrl: { type: 'string' },
            isFeatured: { type: 'boolean' },
            isPublished: { type: 'boolean' },
            categoryId: { type: 'string' },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sku: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'number' }
                }
              }
            }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' }
            }
          }
        }
      },
      preHandler: validateRequest(productSchema),
      handler: async (request: FastifyRequest<{ Body: ProductBody }>, reply: FastifyReply) => {
        try {
          const product = await productService.createProduct(request.body);
          return reply.code(201).send(product);
        } catch (error) {
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });

    fastify.put('/:identifier', {
      schema: {
        tags: ['products'],
        summary: 'Update a product',
        params: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: { type: 'string', description: 'Product ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            mediaUrl: { type: 'string' },
            isFeatured: { type: 'boolean' },
            isPublished: { type: 'boolean' },
            categoryId: { type: 'string' },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sku: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'number' }
                }
              }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' }
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
      preHandler: validateRequest(productSchema.partial()),
      handler: async (request: FastifyRequest<{ Params: ProductParams, Body: Partial<ProductBody> }>, reply) => {
        try {
          const product = await productService.updateProduct(request.params.identifier, request.body);
          if (!product) {
            return reply.code(404).send({ message: 'Product not found' });
          }
          return reply.send(product);
        } catch (error) {
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });

    fastify.delete('/:identifier', {
      schema: {
        tags: ['products'],
        summary: 'Delete a product',
        params: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: { type: 'string', description: 'Product ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Product deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: ProductParams }>, reply) => {
        try {
          const result = await productService.deleteProduct(request.params.identifier);
          if (!result) {
            return reply.code(404).send({ message: 'Product not found' });
          }
          return reply.code(204).send();
        } catch (error) {
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });

    fastify.post('/:identifier/image', {
      schema: {
        tags: ['products'],
        summary: 'Upload product image',
        params: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: { type: 'string', description: 'Product ID' }
          }
        },
        consumes: ['multipart/form-data'],
        response: {
          200: {
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
      handler: async (request: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => {
        try {
          const uploadResult = await handleFileUpload(request);
          const product = await productService.getProductById(request.params.identifier);

          if (!product) {
            return reply.code(404).send({ message: 'Product not found' });
          }

          await productService.updateProduct(request.params.identifier, {
            mediaUrl: uploadResult.filepath
          });

          return reply.send({ message: 'Image uploaded successfully' });
        } catch (error) {
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });
  }
}; 