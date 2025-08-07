import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ContentService } from '../services/content.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { ContentBlockType } from '../entities/ContentBlock';

const contentService = new ContentService();

// Zod schemas for request validation
const CreateContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  type: z.nativeEnum(ContentBlockType),
  content: z.record(z.any()),
  isPublished: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  sortOrder: z.number().optional().default(0),
  parentId: z.string().uuid().optional(),
  locale: z.string().optional().default('en'),
  masterContentBlockId: z.string().uuid().optional()
});

const UpdateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().optional(),
  type: z.nativeEnum(ContentBlockType).optional(),
  content: z.record(z.any()).optional(),
  isPublished: z.boolean().optional(),
  publishAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  sortOrder: z.number().optional(),
  parentId: z.string().uuid().optional().nullable(),
  locale: z.string().optional(),
  masterContentBlockId: z.string().uuid().optional().nullable(),
  changeDescription: z.string().optional()
});

const UpdatePublicationStatusSchema = z.object({
  isPublished: z.boolean()
});

const ContentListQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('10'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  type: z.nativeEnum(ContentBlockType).optional(),
  isPublished: z.string().transform(val => val === 'true').optional(),
  searchTerm: z.string().optional(),
  locale: z.string().optional()
});

export async function cmsRoutes(fastify: FastifyInstance) {
  // Public routes (read-only)
  
  // Get published content by slug
  fastify.get('/by-slug/:slug', {
    schema: {
      tags: ['CMS'],
      summary: 'Get published content by slug',
      description: 'Retrieve published content by its slug',
      params: {
        type: 'object',
        required: ['slug'],
        properties: {
          slug: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          locale: { type: 'string' },
          type: { type: 'string', enum: Object.values(ContentBlockType) }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { slug: string };
    Querystring: { locale?: string; type?: ContentBlockType };
  }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      const { locale, type } = request.query;

      let contentBlock;
      if (type) {
        contentBlock = await contentService.getContentBlockBySlugAndType(slug, type, locale);
      } else {
        contentBlock = await contentService.getContentBlockBySlug(slug, locale);
      }

      if (!contentBlock || !contentBlock.isPublished) {
        return reply.status(404).send({
          success: false,
          message: `Content with slug '${slug}' not found`,
          error: 'NOT_FOUND'
        });
      }

      return reply.status(200).send({
        success: true,
        data: contentBlock
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get content by slug',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get published content by ID
  fastify.get('/:id', {
    schema: {
      tags: ['CMS'],
      summary: 'Get published content by ID',
      description: 'Retrieve published content by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const contentBlock = await contentService.getContentBlockById(id);
      
      if (!contentBlock || !contentBlock.isPublished) {
        return reply.status(404).send({
          success: false,
          message: `Content with ID ${id} not found`,
          error: 'NOT_FOUND'
        });
      }
      
      return reply.status(200).send({
        success: true,
        data: contentBlock
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get content by ID',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get published content blocks list
  fastify.get('/', {
    schema: {
      tags: ['CMS'],
      summary: 'Get published content blocks',
      description: 'Retrieve a list of published content blocks with filtering and pagination',
      querystring: ContentListQuerySchema
    }
  }, async (request: FastifyRequest<{
    Querystring: z.infer<typeof ContentListQuerySchema>;
  }>, reply: FastifyReply) => {
    try {
      const query = request.query;
      
      const [contentBlocks, total] = await contentService.getPublishedContentBlocks(
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder
        },
        {
          type: query.type,
          searchTerm: query.searchTerm,
          locale: query.locale
        }
      );

      return reply.status(200).send({
        success: true,
        data: {
          contentBlocks,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit)
          }
        }
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get content blocks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Protected routes (admin only)
  
  // Create new content block
  fastify.post('/', {
    schema: {
      tags: ['CMS'],
      summary: 'Create new content block',
      description: 'Create a new content block (admin only)',
      security: [{ bearerAuth: [] }],
      body: CreateContentSchema
    },
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{
    Body: z.infer<typeof CreateContentSchema>;
  }>, reply: FastifyReply) => {
    try {
      const contentData = request.body;
      const userId = (request.user as any)?.id;

      // Convert date strings to Date objects and ensure slug is provided
      const processedData = {
        ...contentData,
        slug: contentData.slug || contentData.title.toLowerCase().replace(/\s+/g, '-'),
        publishAt: contentData.publishAt ? new Date(contentData.publishAt) : undefined,
        expiresAt: contentData.expiresAt ? new Date(contentData.expiresAt) : undefined
      };

      const contentBlock = await contentService.createContentBlock({
        ...processedData,
        title: processedData.title || 'Untitled Content Block',
        type: processedData.type || ContentBlockType.PAGE,
        content: processedData.content || {},
      }, userId);

      return reply.status(201).send({
        success: true,
        data: contentBlock
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to create content block',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update content block
  fastify.put('/:id', {
    schema: {
      tags: ['CMS'],
      summary: 'Update content block',
      description: 'Update an existing content block (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: UpdateContentSchema
    },
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: z.infer<typeof UpdateContentSchema>;
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const userId = (request.user as any)?.id;

      // Convert date strings to Date objects
      const processedData = {
        ...updateData,
        publishAt: updateData.publishAt ? new Date(updateData.publishAt) : undefined,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined
      };

      const contentBlock = await contentService.updateContentBlock(
        id, 
        processedData, 
        userId, 
        updateData.changeDescription
      );

      return reply.status(200).send({
        success: true,
        data: contentBlock
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'NOT_FOUND'
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to update content block',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update publication status
  fastify.patch('/:id/publication', {
    schema: {
      tags: ['CMS'],
      summary: 'Update publication status',
      description: 'Update the publication status of a content block (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: UpdatePublicationStatusSchema
    },
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: z.infer<typeof UpdatePublicationStatusSchema>;
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { isPublished } = request.body;
      const userId = (request.user as any)?.id;

      const contentBlock = await contentService.updatePublicationStatus(id, isPublished, userId);

      return reply.status(200).send({
        success: true,
        data: contentBlock
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'NOT_FOUND'
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to update publication status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete content block
  fastify.delete('/:id', {
    schema: {
      tags: ['CMS'],
      summary: 'Delete content block',
      description: 'Delete a content block (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const deleted = await contentService.deleteContentBlock(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          message: `Content block with ID ${id} not found`,
          error: 'NOT_FOUND'
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Content block deleted successfully'
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete content block',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all content blocks (admin only)
  fastify.get('/admin/all', {
    schema: {
      tags: ['CMS'],
      summary: 'Get all content blocks',
      description: 'Retrieve a list of all content blocks with filtering and pagination (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: ContentListQuerySchema
    },
    preHandler: requireAdmin
  }, async (request: FastifyRequest<{
    Querystring: z.infer<typeof ContentListQuerySchema>;
  }>, reply: FastifyReply) => {
    try {
      const query = request.query;
      
      const [contentBlocks, total] = await contentService.getContentBlocks(
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder
        },
        {
          type: query.type,
          isPublished: query.isPublished,
          searchTerm: query.searchTerm,
          locale: query.locale
        }
      );

      return reply.status(200).send({
        success: true,
        data: {
          contentBlocks,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit)
          }
        }
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get content blocks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 