import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CategoryService } from '../services/category.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import { handleCategoryImageUpload } from '../utils/fileUpload';

const categoryService = new CategoryService();

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = categorySchema.partial();

const listCategoriesSchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const categoryController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    // List categories (public)
    fastify.get('/', {
      schema: {
        tags: ['categories'],
        summary: 'List all categories',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            pageSize: { type: 'string' },
            search: { type: 'string' },
            status: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string' },
                    isActive: { type: 'boolean' },
                    parentId: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Querystring: z.infer<typeof listCategoriesSchema>;
      }>, reply: FastifyReply) => {
        const { page, pageSize, search, status, parentId, sortBy, sortOrder } = request.query;
        
        const skip = page ? (parseInt(page) - 1) * (parseInt(pageSize || '10')) : 0;
        const take = pageSize ? parseInt(pageSize) : 10;
        
        const result = await categoryService.listCategories({
          skip,
          take,
          search,
          isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
          parentId: parentId === 'null' ? null : parentId,
          sortBy,
          sortOrder: sortOrder?.toUpperCase() as 'ASC' | 'DESC',
        });

        return reply.send({
          categories: result.categories,
          pagination: {
            total: result.total,
            hasMore: result.hasMore,
          },
        });
      },
    });

    // Get featured categories (public)
    fastify.get('/featured', {
      schema: {
        tags: ['categories'],
        summary: 'Get featured categories',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Number of categories to return' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string' },
                    isActive: { type: 'boolean' },
                    parentId: { type: ['string', 'null'] },
                    productCount: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Querystring: { limit?: string };
      }>, reply: FastifyReply) => {
        try {
          const limit = request.query.limit ? parseInt(request.query.limit) : 10;
          
          // Get all active categories
          const result = await categoryService.listCategories({
            skip: 0,
            take: limit,
            isActive: true,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          });
          
          // For now, since we don't have a 'featured' field, we'll just return the most recent categories
          // In a real implementation, you would filter by a 'featured' field
          
          return reply.send({
            categories: result.categories.map(category => ({
              ...category,
              productCount: Math.floor(Math.random() * 50) + 10, // Placeholder for product count
            })),
          });
        } catch (error) {
          request.log.error(error);
          return reply.code(500).send({ 
            message: 'Error fetching featured categories',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
    });

    // Get category by ID (public)
    fastify.get('/:id', {
      schema: {
        tags: ['categories'],
        summary: 'Get category by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              imageUrl: { type: 'string' },
              isActive: { type: 'boolean' },
              parentId: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Params: { id: string };
      }>, reply: FastifyReply) => {
        const category = await categoryService.getCategoryById(request.params.id);
        if (!category) {
          return reply.code(404).send({ message: 'Category not found' });
        }
        return reply.send(category);
      },
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    // List categories (admin)
    fastify.get('/', {
      schema: {
        tags: ['admin-categories'],
        summary: 'List all categories (admin)',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            pageSize: { type: 'string' },
            limit: { type: 'string' },
            search: { type: 'string' },
            status: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          },
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
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string' },
                    isActive: { type: 'boolean' },
                    parentId: { type: ['string', 'null'] },
                    parent: {
                      type: ['object', 'null'],
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      }
                    },
                    productCount: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Querystring: z.infer<typeof listCategoriesSchema>;
      }>, reply: FastifyReply) => {
        try {
          const { page, pageSize, search, status, parentId, sortBy, sortOrder } = request.query;
          
          const pageNum = page ? parseInt(page) : 1;
          const limit = pageSize ? parseInt(pageSize) : (request.query.limit ? parseInt(request.query.limit as string) : 10);
          const skip = (pageNum - 1) * limit;
          
          const result = await categoryService.listCategories({
            skip,
            take: limit,
            search,
            isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
            parentId: parentId === 'null' ? null : parentId,
            sortBy: sortBy || 'createdAt',
            sortOrder: (sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
            includeParent: true,
          });

          // Calculate total pages
          const totalPages = Math.ceil(result.total / limit);

          // Format response in the admin format with data and meta
          return reply.send({
            data: result.categories.map(category => ({
              ...category,
              productCount: Math.floor(Math.random() * 50) + 10, // Placeholder for product count - should be replaced with actual count
            })),
            meta: {
              total: result.total,
              page: pageNum,
              limit,
              totalPages,
              hasNextPage: pageNum < totalPages,
              hasPrevPage: pageNum > 1,
            },
          });
        } catch (error) {
          request.log.error(error);
          return reply.code(500).send({ 
            message: 'Error fetching categories',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
    });

    // Upload category image
    fastify.post('/upload-image', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Upload a category image',
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              imageUrl: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const imageUrl = await handleCategoryImageUpload(request);
          return reply.send({ imageUrl });
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error uploading image',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Create category (protected)
    fastify.post('/', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Create a new category',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2 },
            description: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            imageUrl: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              imageUrl: { type: 'string' },
              isActive: { type: 'boolean' },
              parentId: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      preHandler: validateRequest(categorySchema),
      handler: async (request: FastifyRequest<{
        Body: z.infer<typeof categorySchema>;
      }>, reply: FastifyReply) => {
        const category = await categoryService.createCategory({
          ...request.body,
          parentId: request.body.parentId === 'null' ? null : request.body.parentId,
        });
        return reply.code(201).send(category);
      },
    });

    // Create category with image upload
    fastify.post('/with-image', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Create a new category with image upload',
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              imageUrl: { type: 'string' },
              isActive: { type: 'boolean' },
              parentId: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          // First handle the image upload
          const imageUrl = await handleCategoryImageUpload(request);
          
          // Then get the form fields
          const data = await request.body as any;
          
          // Create the category with the uploaded image URL
          const category = await categoryService.createCategory({
            name: data.name,
            description: data.description,
            parentId: data.parentId === 'null' ? null : data.parentId,
            isActive: data.isActive === 'true',
            imageUrl
          });
          
          return reply.code(201).send(category);
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error creating category with image',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Update category (protected)
    fastify.put('/:id', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Update a category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            description: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            imageUrl: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              imageUrl: { type: 'string' },
              isActive: { type: 'boolean' },
              parentId: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      preHandler: validateRequest(updateCategorySchema),
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof updateCategorySchema>;
      }>, reply: FastifyReply) => {
        const category = await categoryService.updateCategory(request.params.id, {
          ...request.body,
          parentId: request.body.parentId === 'null' ? null : request.body.parentId,
        });
        return reply.send(category);
      },
    });

    // Update category with image upload
    fastify.put('/:id/with-image', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Update a category with image upload',
        consumes: ['multipart/form-data'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              imageUrl: { type: 'string' },
              isActive: { type: 'boolean' },
              parentId: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Params: { id: string };
      }>, reply: FastifyReply) => {
        try {
          // First handle the image upload
          const imageUrl = await handleCategoryImageUpload(request);
          
          // Then get the form fields
          const data = await request.body as any;
          
          // Update the category with the uploaded image URL
          const category = await categoryService.updateCategory(request.params.id, {
            name: data.name,
            description: data.description,
            parentId: data.parentId === 'null' ? null : data.parentId,
            isActive: data.isActive === 'true',
            imageUrl
          });
          
          return reply.send(category);
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error updating category with image',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Delete category (protected)
    fastify.delete('/:id', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Delete a category',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Params: { id: string };
      }>, reply: FastifyReply) => {
        await categoryService.deleteCategory(request.params.id);
        return reply.code(204).send();
      },
    });

    // Bulk delete categories (protected)
    fastify.post('/bulk-delete', {
      schema: {
        tags: ['admin-categories'],
        summary: 'Bulk delete categories',
        body: {
          type: 'object',
          required: ['categoryIds'],
          properties: {
            categoryIds: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      handler: async (request: FastifyRequest<{
        Body: { categoryIds: string[] };
      }>, reply: FastifyReply) => {
        await categoryService.bulkDeleteCategories(request.body.categoryIds);
        return reply.code(204).send();
      },
    });
  },
}; 