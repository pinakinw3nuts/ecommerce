import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService, ProductFilterOptions, ProductSortOptions, ProductPaginationOptions } from '../services/product.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import { handleFileUpload } from '../utils/fileUpload';
import { Product } from '../entities/Product';

const productService = new ProductService();

// Helper function to transform a product entity into a clean response object
function formatProductResponse(product: Product) {
  console.log('Formatting product response for:', product.id);
  
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    slug: product.slug,
    mediaUrl: product.mediaUrl,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    salePrice: product.salePrice,
    saleStartDate: product.saleStartDate,
    saleEndDate: product.saleEndDate,
    stockQuantity: product.stockQuantity,
    isInStock: product.isInStock,
    specifications: product.specifications,
    keywords: product.keywords,
    seoMetadata: product.seoMetadata || null,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description
    } : null,
    brand: product.brand ? {
      id: product.brand.id,
      name: product.brand.name
    } : null,
    variants: Array.isArray(product.variants) ? product.variants.map(v => ({
      id: v.id,
      name: v.name,
      sku: v.sku, 
      price: v.price,
      stock: v.stock
    })) : [],
    tagIds: Array.isArray(product.tags) ? product.tags.map(t => t.id) : [],
    tags: Array.isArray(product.tags) ? product.tags.map(t => ({
      id: t.id,
      name: t.name
    })) : [],
    images: Array.isArray(product.images) ? product.images : [],
    attributes: Array.isArray(product.attributes) ? product.attributes : [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

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
  salePrice: z.number().optional(),
  saleStartDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  saleEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  stockQuantity: z.number().optional(),
  isInStock: z.boolean().optional(),
  specifications: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  seoMetadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
  brandId: z.string().optional(),
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
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating']).optional().transform(val => {
    console.log('Transforming sortBy value:', val, typeof val);
    return val;
  }),
  sortOrder: z.enum(['ASC', 'DESC']).optional().transform(val => {
    console.log('Transforming sortOrder value:', val, typeof val);
    return val;
  }),
  
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
  tagIds?: string[];
  variants?: Array<{
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  stockQuantity?: number;
  isInStock?: boolean;
  specifications?: string;
  keywords?: string[];
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  brandId?: string;
}

interface ProductQueryParams {
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating';
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
    // GET /products/featured - Get featured products
    fastify.get('/featured', {
      schema: {
        tags: ['products'],
        summary: 'Get featured products',
        description: 'Retrieve a list of featured products',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', description: 'Number of items to return', default: 4 },
            page: { type: 'integer', description: 'Page number (starts from 1)', default: 1 }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as { limit?: string; page?: string };
        
        // Parse query parameters
        const limit = query.limit ? parseInt(query.limit) : 4;
        const page = query.page ? parseInt(query.page) : 1;
        
        // Use the existing product service to fetch featured products
        const result = await productService.listProducts({
          filters: {
            isFeatured: true,
            isPublished: true
          },
          pagination: {
            page,
            limit
          },
          sort: {
            sortBy: 'createdAt',
            sortOrder: 'DESC'
          }
        });
        
        // Format the response
        const formattedProducts = result.data.map(formatProductResponse);
        
        return reply.status(200).send({
          success: true,
          products: formattedProducts,
          pagination: {
            page: result.meta.page,
            limit: result.meta.limit,
            total: result.meta.total,
            totalPages: result.meta.totalPages
          }
        });
      } catch (error) {
        console.error('Error fetching featured products:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch featured products',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /products/sale - Get products on sale
    fastify.get('/sale', {
      schema: {
        tags: ['products'],
        summary: 'Get products on sale',
        description: 'Retrieve a list of products with sale prices',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', description: 'Number of items to return', default: 4 },
            page: { type: 'integer', description: 'Page number (starts from 1)', default: 1 }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as { limit?: string; page?: string };
        
        // Parse query parameters
        const limit = query.limit ? parseInt(query.limit) : 4;
        const page = query.page ? parseInt(query.page) : 1;
        
        // Use the existing product service to fetch products on sale
        const result = await productService.listProducts({
          filters: {
            isPublished: true,
            hasSalePrice: true // Custom filter to be implemented in the service
          },
          pagination: {
            page,
            limit
          },
          sort: {
            sortBy: 'createdAt',
            sortOrder: 'DESC'
          }
        });
        
        // Filter products that have a sale price
        const saleProducts = result.data.filter(product => 
          product.salePrice !== undefined && 
          product.salePrice !== null && 
          product.salePrice > 0 && 
          product.salePrice < product.price
        );
        
        // Format the response
        const formattedProducts = saleProducts.map(formatProductResponse);
        
        return reply.status(200).send({
          success: true,
          products: formattedProducts,
          pagination: {
            page: result.meta.page,
            limit: result.meta.limit,
            total: saleProducts.length,
            totalPages: Math.ceil(saleProducts.length / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching sale products:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch sale products',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

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
          
          // Format each product in the result data array
          const formattedResult = {
            data: result.data.map(product => formatProductResponse(product)),
            meta: result.meta
          };
          
          console.log(`Returning ${formattedResult.data.length} formatted products`);
          
          return reply.send(formattedResult);
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
              mediaUrl: { type: 'string', nullable: true },
              isFeatured: { type: 'boolean' },
              isPublished: { type: 'boolean' },
              salePrice: { type: 'number', nullable: true },
              saleStartDate: { type: 'string', format: 'date-time', nullable: true },
              saleEndDate: { type: 'string', format: 'date-time', nullable: true },
              stockQuantity: { type: 'number' },
              isInStock: { type: 'boolean' },
              specifications: { type: 'string', nullable: true },
              keywords: { 
                type: 'array',
                items: { type: 'string' },
                nullable: true
              },
              seoMetadata: {
                type: 'object',
                nullable: true,
                properties: {
                  title: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  keywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    nullable: true
                  },
                  ogImage: { type: 'string', nullable: true }
                }
              },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true }
                }
              },
              brand: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
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
          console.log(`Getting product with identifier: ${identifier}`);
          
          let product: Product | null;

          // Try to find by ID first
          product = await productService.getProductById(identifier);
          console.log(`Product retrieval result:`, {
            found: !!product,
            fields: product ? Object.keys(product) : [],
            relations: product ? {
              hasCategory: !!product.category,
              hasTags: Array.isArray(product.tags) ? product.tags.length : 0,
              hasVariants: Array.isArray(product.variants) ? product.variants.length : 0,
              hasBrand: !!product.brand,
              hasImages: Array.isArray(product.images) ? product.images.length : 0,
              hasAttributes: Array.isArray(product.attributes) ? product.attributes.length : 0
            } : null
          });

          // If not found by ID, try to find by slug
          if (!product) {
            console.log(`Product not found by ID, trying by slug...`);
            const result = await productService.listProducts({
              filters: { search: identifier },
              pagination: { page: 1, limit: 1 }
            });
            product = result.data.find((p: Product) => p.slug === identifier) || null;
            console.log(`Search result:`, {
              found: !!product,
              totalResults: result.data.length
            });
          }

          if (!product) {
            console.log(`Product not found with identifier: ${identifier}`);
            return reply.code(404).send({ message: 'Product not found' });
          }

          // Format the product response using the helper function
          const fullProduct = formatProductResponse(product);

          console.log(`Sending full product response with fields:`, Object.keys(fullProduct));
          return reply.send(fullProduct);
        } catch (error) {
          console.error(`Error retrieving product:`, error);
          request.log.error(error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
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
            tagIds: { type: 'array', items: { type: 'string' } },
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
            },
            salePrice: { type: 'number' },
            saleStartDate: { type: 'string', format: 'date-time' },
            saleEndDate: { type: 'string', format: 'date-time' },
            stockQuantity: { type: 'number' },
            isInStock: { type: 'boolean' },
            specifications: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            seoMetadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                ogImage: { type: 'string' }
              }
            },
            brandId: { type: 'string' }
          }
        },
        response: {
          201: {
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
                  name: { type: 'string' }
                }
              },
              brand: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              salePrice: { type: 'number', nullable: true },
              saleStartDate: { type: 'string', format: 'date-time', nullable: true },
              saleEndDate: { type: 'string', format: 'date-time', nullable: true },
              stockQuantity: { type: 'number' },
              isInStock: { type: 'boolean' },
              specifications: { type: 'string', nullable: true },
              keywords: { type: 'array', items: { type: 'string' }, nullable: true },
              seoMetadata: {
                type: 'object',
                nullable: true,
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  keywords: { type: 'array', items: { type: 'string' } },
                  ogImage: { type: 'string' }
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
      },
      preHandler: validateRequest(productSchema),
      handler: async (request: FastifyRequest<{ Body: ProductBody }>, reply: FastifyReply) => {
        try {
          console.log('Creating product with data:', request.body);
          
          // Add detailed logging for date fields
          if (request.body.saleStartDate) {
            console.log('saleStartDate raw value:', request.body.saleStartDate);
            console.log('saleStartDate type:', typeof request.body.saleStartDate);
            console.log('saleStartDate instanceof Date:', request.body.saleStartDate instanceof Date);
            console.log('saleStartDate after parsing:', new Date(request.body.saleStartDate));
          }
          
          if (request.body.saleEndDate) {
            console.log('saleEndDate raw value:', request.body.saleEndDate);
            console.log('saleEndDate type:', typeof request.body.saleEndDate);
            console.log('saleEndDate instanceof Date:', request.body.saleEndDate instanceof Date);
            console.log('saleEndDate after parsing:', new Date(request.body.saleEndDate));
          }
          
          const product = await productService.createProduct(request.body);
          // Format the product response using the helper function
          const formattedProduct = formatProductResponse(product);
          console.log(`Created product, returning with fields:`, Object.keys(formattedProduct));
          return reply.code(201).send(formattedProduct);
        } catch (error) {
          console.error('Error creating product:', error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
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
            tagIds: { type: 'array', items: { type: 'string' } },
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
            },
            salePrice: { type: 'number' },
            saleStartDate: { type: 'string', format: 'date-time' },
            saleEndDate: { type: 'string', format: 'date-time' },
            stockQuantity: { type: 'number' },
            isInStock: { type: 'boolean' },
            specifications: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            seoMetadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                ogImage: { type: 'string' }
              }
            },
            brandId: { type: 'string' }
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
              mediaUrl: { type: 'string', nullable: true },
              isFeatured: { type: 'boolean' },
              isPublished: { type: 'boolean' },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              brand: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              salePrice: { type: 'number', nullable: true },
              saleStartDate: { type: 'string', format: 'date-time', nullable: true },
              saleEndDate: { type: 'string', format: 'date-time', nullable: true },
              stockQuantity: { type: 'number' },
              isInStock: { type: 'boolean' },
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
          console.log(`Updating product with identifier: ${request.params.identifier}`);
          console.log(`Update data:`, request.body);
          
          // Add detailed logging for date fields
          if (request.body.saleStartDate) {
            console.log('saleStartDate raw value:', request.body.saleStartDate);
            console.log('saleStartDate type:', typeof request.body.saleStartDate);
            console.log('saleStartDate instanceof Date:', request.body.saleStartDate instanceof Date);
            console.log('saleStartDate after parsing:', new Date(request.body.saleStartDate));
          }
          
          if (request.body.saleEndDate) {
            console.log('saleEndDate raw value:', request.body.saleEndDate);
            console.log('saleEndDate type:', typeof request.body.saleEndDate);
            console.log('saleEndDate instanceof Date:', request.body.saleEndDate instanceof Date);
            console.log('saleEndDate after parsing:', new Date(request.body.saleEndDate));
          }
          
          const product = await productService.updateProduct(request.params.identifier, request.body);
          if (!product) {
            console.log(`Product not found for update: ${request.params.identifier}`);
            return reply.code(404).send({ message: 'Product not found' });
          }
          
          // Format the product response using the helper function
          const formattedProduct = formatProductResponse(product);
          console.log(`Updated product, returning with fields:`, Object.keys(formattedProduct));
          
          return reply.send(formattedProduct);
        } catch (error) {
          console.error(`Error updating product:`, error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
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
          
          // Format each product in the result data array
          const formattedResult = {
            data: result.data.map(product => formatProductResponse(product)),
            meta: result.meta
          };
          
          console.log(`Returning ${formattedResult.data.length} formatted products`);
          
          return reply.send(formattedResult);
        } catch (error) {
          request.log.error('Error in admin product list handler:', error);
          console.error('Detailed error:', error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
        }
      }
    });

    // Protected GET /products/:identifier - Get a product by ID or slug
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
              mediaUrl: { type: 'string', nullable: true },
              isFeatured: { type: 'boolean' },
              isPublished: { type: 'boolean' },
              salePrice: { type: 'number', nullable: true },
              saleStartDate: { type: 'string', format: 'date-time', nullable: true },
              saleEndDate: { type: 'string', format: 'date-time', nullable: true },
              stockQuantity: { type: 'number' },
              isInStock: { type: 'boolean' },
              specifications: { type: 'string', nullable: true },
              keywords: { 
                type: 'array',
                items: { type: 'string' },
                nullable: true
              },
              seoMetadata: {
                type: 'object',
                nullable: true,
                properties: {
                  title: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  keywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    nullable: true
                  },
                  ogImage: { type: 'string', nullable: true }
                }
              },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true }
                }
              },
              brand: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
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
          console.log(`Getting product with identifier: ${identifier}`);
          
          let product: Product | null;

          // Try to find by ID first
          product = await productService.getProductById(identifier);
          console.log(`Product retrieval result:`, {
            found: !!product,
            fields: product ? Object.keys(product) : [],
            relations: product ? {
              hasCategory: !!product.category,
              hasTags: Array.isArray(product.tags) ? product.tags.length : 0,
              hasVariants: Array.isArray(product.variants) ? product.variants.length : 0,
              hasBrand: !!product.brand,
              hasImages: Array.isArray(product.images) ? product.images.length : 0,
              hasAttributes: Array.isArray(product.attributes) ? product.attributes.length : 0
            } : null
          });

          // If not found by ID, try to find by slug
          if (!product) {
            console.log(`Product not found by ID, trying by slug...`);
            const result = await productService.listProducts({
              filters: { search: identifier },
              pagination: { page: 1, limit: 1 }
            });
            product = result.data.find((p: Product) => p.slug === identifier) || null;
            console.log(`Search result:`, {
              found: !!product,
              totalResults: result.data.length
            });
          }

          if (!product) {
            console.log(`Product not found with identifier: ${identifier}`);
            return reply.code(404).send({ message: 'Product not found' });
          }

          // Format the product response using the helper function
          const fullProduct = formatProductResponse(product);

          console.log(`Sending full product response with fields:`, Object.keys(fullProduct));
          return reply.send(fullProduct);
        } catch (error) {
          console.error(`Error retrieving product:`, error);
          request.log.error(error);
          return reply.code(500).send({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
        }
      }
    });
  }
}; 