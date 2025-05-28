import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService, ProductFilterOptions, ProductSortOptions, ProductPaginationOptions } from '../services/product.service';
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

// Schema for query parameters
const productQuerySchema = z.object({
  // Pagination
  page: z.string().or(z.number()).transform(val => {
    console.log('Transforming page value:', val, typeof val);
    return val;
  }),
  limit: z.string().or(z.number()).transform(val => {
    console.log('Transforming limit value:', val, typeof val);
    return val;
  }),
  
  // Sorting
  sortBy: z.enum(['name', 'price', 'createdAt']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  
  // Filtering
  search: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.string().optional(),
  minPrice: z.union([
    z.string().transform(val => val ? parseFloat(val) : undefined),
    z.number().optional()
  ]).optional(),
  maxPrice: z.union([
    z.string().transform(val => val ? parseFloat(val) : undefined),
    z.number().optional()
  ]).optional(),
  tagIds: z.string().optional().transform(val => val ? val.split(',') : undefined),
  isFeatured: z.union([
    z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ]).optional(),
  isPublished: z.union([
    z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ]).optional(),
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

interface ProductQueryParams {
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  
  // Filtering
  search?: string;
  categoryId?: string;
  categoryIds?: string;
  minPrice?: number;
  maxPrice?: number;
  tagIds?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
}

export const productController = {
  // Public routes - accessible without authentication
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    // GET /products - List all products with filtering, sorting, and pagination
    fastify.get('/', {
      schema: {
        tags: ['products'],
        summary: 'List all products with filtering, sorting, and pagination',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: 'Page number (starts from 1)' },
            limit: { type: 'integer', description: 'Number of items per page' },
            sortBy: { type: 'string', enum: ['name', 'price', 'createdAt'], description: 'Field to sort by' },
            sortOrder: { type: 'string', enum: ['ASC', 'DESC'], description: 'Sort direction' },
            search: { type: 'string', description: 'Search term for product name' },
            categoryId: { type: 'string', description: 'Filter by category ID' },
            categoryIds: { type: 'string', description: 'Filter by comma-separated list of category IDs' },
            minPrice: { type: 'number', description: 'Minimum price filter' },
            maxPrice: { type: 'number', description: 'Maximum price filter' },
            tagIds: { type: 'string', description: 'Comma-separated list of tag IDs' },
            isFeatured: { type: 'boolean', description: 'Filter by featured status' },
            isPublished: { type: 'boolean', description: 'Filter by published status' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
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
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      preHandler: validateRequest(productQuerySchema, 'query'),
      handler: async (request: FastifyRequest<{ Querystring: ProductQueryParams }>, reply) => {
        try {
          const query = request.query;
          
          // Debug logging to see the exact types of parameters
          console.log('Query parameters received:', {
            page: {
              value: query.page,
              type: typeof query.page
            },
            limit: {
              value: query.limit,
              type: typeof query.limit
            },
            sortBy: {
              value: query.sortBy,
              type: typeof query.sortBy
            },
            sortOrder: {
              value: query.sortOrder,
              type: typeof query.sortOrder
            },
            search: {
              value: query.search,
              type: typeof query.search
            },
            categoryId: {
              value: query.categoryId,
              type: typeof query.categoryId,
              hasComma: query.categoryId ? query.categoryId.includes(',') : false,
              splitResult: query.categoryId ? query.categoryId.split(',').map(id => id.trim()).filter(id => id) : []
            },
            categoryIds: {
              value: query.categoryIds,
              type: typeof query.categoryIds,
              hasComma: query.categoryIds ? query.categoryIds.includes(',') : false,
              splitResult: query.categoryIds ? query.categoryIds.split(',').map(id => id.trim()).filter(id => id) : []
            }
          });
          
          // Get the effective category ID (use categoryIds if provided, otherwise use categoryId)
          const effectiveCategoryId = query.categoryIds || query.categoryId;
          
          // Build options for the service
          const options = {
            pagination: {
              page: query.page ? Number(query.page) : 1,
              limit: query.limit ? Number(query.limit) : 10
            } as ProductPaginationOptions,
            sort: {
              sortBy: query.sortBy,
              sortOrder: query.sortOrder
            } as ProductSortOptions,
            filters: {
              search: query.search,
              categoryId: effectiveCategoryId,
              minPrice: query.minPrice,
              maxPrice: query.maxPrice,
              tagIds: query.tagIds,
              isFeatured: query.isFeatured,
              isPublished: query.isPublished
            } as ProductFilterOptions
          };
          
          // Debug the options being passed to the service
          console.log('Options passed to service:', JSON.stringify(options, null, 2));
          
          const result = await productService.listProducts(options);
          return reply.send(result);
        } catch (error) {
          request.log.error('Error in admin product list handler:', error);
          console.error('Detailed error:', error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
        }
      }
    });

    // GET /products/:identifier - Get a product by ID or slug
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
            const result = await productService.listProducts({
              filters: { search: identifier },
              pagination: { page: 1, limit: 1 }
            });
            product = result.data.find((p: Product) => p.slug === identifier) || null;
          }

          if (!product) {
            return reply.code(404).send({ message: 'Product not found' });
          }

          return reply.send(product);
        } catch (error) {
          request.log.error(error);
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });
  },

  // Protected routes - require authentication
  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    // POST /products - Create a new product
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

    // PUT /products/:identifier - Update a product
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

    // DELETE /products/:identifier - Delete a product
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

    // POST /products/:identifier/image - Upload a product image
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
    
    // ALSO register the same GET routes as in public routes for authenticated users
    // GET /products - List all products with filtering, sorting, and pagination
    fastify.get('/', {
      schema: {
        tags: ['products'],
        summary: 'List all products with filtering, sorting, and pagination (protected)',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: 'Page number (starts from 1)' },
            limit: { type: 'integer', description: 'Number of items per page' },
            sortBy: { type: 'string', enum: ['name', 'price', 'createdAt'], description: 'Field to sort by' },
            sortOrder: { type: 'string', enum: ['ASC', 'DESC'], description: 'Sort direction' },
            search: { type: 'string', description: 'Search term for product name' },
            categoryId: { type: 'string', description: 'Filter by category ID' },
            categoryIds: { type: 'string', description: 'Filter by comma-separated list of category IDs' },
            minPrice: { type: 'number', description: 'Minimum price filter' },
            maxPrice: { type: 'number', description: 'Maximum price filter' },
            tagIds: { type: 'string', description: 'Comma-separated list of tag IDs' },
            isFeatured: { type: 'boolean', description: 'Filter by featured status' },
            isPublished: { type: 'boolean', description: 'Filter by published status' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
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
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      preHandler: validateRequest(productQuerySchema, 'query'),
      handler: async (request: FastifyRequest<{ Querystring: ProductQueryParams }>, reply) => {
        try {
          const query = request.query;
          
          // Debug logging to see the exact types of parameters
          console.log('Query parameters received:', {
            page: {
              value: query.page,
              type: typeof query.page
            },
            limit: {
              value: query.limit,
              type: typeof query.limit
            },
            sortBy: {
              value: query.sortBy,
              type: typeof query.sortBy
            },
            sortOrder: {
              value: query.sortOrder,
              type: typeof query.sortOrder
            },
            search: {
              value: query.search,
              type: typeof query.search
            },
            categoryId: {
              value: query.categoryId,
              type: typeof query.categoryId,
              hasComma: query.categoryId ? query.categoryId.includes(',') : false,
              splitResult: query.categoryId ? query.categoryId.split(',').map(id => id.trim()).filter(id => id) : []
            },
            categoryIds: {
              value: query.categoryIds,
              type: typeof query.categoryIds,
              hasComma: query.categoryIds ? query.categoryIds.includes(',') : false,
              splitResult: query.categoryIds ? query.categoryIds.split(',').map(id => id.trim()).filter(id => id) : []
            }
          });
          
          // Get the effective category ID (use categoryIds if provided, otherwise use categoryId)
          const effectiveCategoryId = query.categoryIds || query.categoryId;
          
          // Build options for the service
          const options = {
            pagination: {
              page: query.page ? Number(query.page) : 1,
              limit: query.limit ? Number(query.limit) : 10
            } as ProductPaginationOptions,
            sort: {
              sortBy: query.sortBy,
              sortOrder: query.sortOrder
            } as ProductSortOptions,
            filters: {
              search: query.search,
              categoryId: effectiveCategoryId,
              minPrice: query.minPrice,
              maxPrice: query.maxPrice,
              tagIds: query.tagIds,
              isFeatured: query.isFeatured,
              isPublished: query.isPublished
            } as ProductFilterOptions
          };
          
          // Debug the options being passed to the service
          console.log('Options passed to service:', JSON.stringify(options, null, 2));
          
          const result = await productService.listProducts(options);
          return reply.send(result);
        } catch (error) {
          request.log.error('Error in admin product list handler:', error);
          console.error('Detailed error:', error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
        }
      }
    });

    // GET /products/:identifier - Get a product by ID or slug
    fastify.get('/:identifier', {
      schema: {
        tags: ['products'],
        summary: 'Get a product by ID or slug (protected)',
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
            const result = await productService.listProducts({
              filters: { search: identifier },
              pagination: { page: 1, limit: 1 }
            });
            product = result.data.find((p: Product) => p.slug === identifier) || null;
          }

          if (!product) {
            return reply.code(404).send({ message: 'Product not found' });
          }

          return reply.send(product);
        } catch (error) {
          request.log.error(error);
          return reply.code(500).send({ message: 'Internal server error' });
        }
      }
    });
  }
}; 