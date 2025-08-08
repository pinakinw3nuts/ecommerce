import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ContentService } from '../services/content.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { ContentBlockType } from '../entities/ContentBlock';

const contentService = new ContentService();

// JSON schemas for request validation
const CreateContentSchema = {
  type: 'object',
  required: ['title', 'type', 'content'],
  properties: {
    title: { type: 'string', minLength: 1 },
    slug: { type: 'string' },
    type: { type: 'string', enum: ['BANNER', 'HERO', 'FEATURED_PRODUCTS', 'CATEGORY_GRID', 'TESTIMONIALS', 'NEWSLETTER', 'FOOTER', 'SIDEBAR', 'CUSTOM'] },
    content: { type: 'object' },
    isPublished: { type: 'boolean', default: false },
    publishAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    metaKeywords: { type: 'string' },
    ogImage: { type: 'string', format: 'uri' },
    metadata: { type: 'object' },
    sortOrder: { type: 'number', default: 0 },
    parentId: { type: 'string', format: 'uuid' },
    locale: { type: 'string', default: 'en' },
    masterContentBlockId: { type: 'string', format: 'uuid' }
  }
};

const UpdateContentSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    slug: { type: 'string' },
    type: { type: 'string', enum: ['BANNER', 'HERO', 'FEATURED_PRODUCTS', 'CATEGORY_GRID', 'TESTIMONIALS', 'NEWSLETTER', 'FOOTER', 'SIDEBAR', 'CUSTOM'] },
    content: { type: 'object' },
    isPublished: { type: 'boolean' },
    publishAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    metaKeywords: { type: 'string' },
    ogImage: { type: 'string', format: 'uri' },
    metadata: { type: 'object' },
    sortOrder: { type: 'number' },
    parentId: { type: 'string', format: 'uuid' },
    locale: { type: 'string' },
    masterContentBlockId: { type: 'string', format: 'uuid' },
    changeDescription: { type: 'string' }
  }
};

const UpdatePublicationStatusSchema = {
  type: 'object',
  required: ['isPublished'],
  properties: {
    isPublished: { type: 'boolean' }
  }
};

const ContentListQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'string', default: '1' },
    limit: { type: 'string', default: '10' },
    sortBy: { type: 'string', default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
    type: { type: 'string', enum: ['BANNER', 'HERO', 'FEATURED_PRODUCTS', 'CATEGORY_GRID', 'TESTIMONIALS', 'NEWSLETTER', 'FOOTER', 'SIDEBAR', 'CUSTOM'] },
    isPublished: { type: 'string' },
    searchTerm: { type: 'string' },
    locale: { type: 'string' }
  }
};

// TS helper types for request typing
type ContentListQuery = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: string;
  isPublished?: string | boolean;
  searchTerm?: string;
  locale?: string;
};

type CreateContentBody = {
  title: string;
  slug?: string;
  type?: string;
  content?: Record<string, unknown>;
  isPublished?: boolean;
  publishAt?: string;
  expiresAt?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  parentId?: string;
  locale?: string;
  masterContentBlockId?: string;
};

type UpdateContentBody = Partial<CreateContentBody> & { changeDescription?: string };
type UpdatePublicationBody = { isPublished: boolean };

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
  }, async (request: FastifyRequest<{ Querystring: ContentListQuery }>, reply: FastifyReply) => {
    try {
      const q = request.query;
      const page = typeof q.page === 'string' ? parseInt(q.page, 10) : (q.page || 1);
      const limit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : (q.limit || 10);
      
      const [contentBlocks, total] = await contentService.getPublishedContentBlocks(
        {
          page,
          limit,
          sortBy: q.sortBy,
          sortOrder: q.sortOrder
        },
        {
          type: q.type as any,
          searchTerm: q.searchTerm,
          locale: q.locale
        }
      );

      return reply.status(200).send({
        success: true,
        data: {
          contentBlocks,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
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
  }, async (request: FastifyRequest<{ Body: CreateContentBody }>, reply: FastifyReply) => {
    try {
      const contentData = request.body;
      const userId = (request.user as any)?.id;

      // Convert date strings to Date objects and ensure slug is provided
      const processedData: CreateContentBody = {
        ...contentData,
        slug: contentData.slug || contentData.title.toLowerCase().replace(/\s+/g, '-'),
        publishAt: contentData.publishAt ? (new Date(contentData.publishAt) as any) : undefined,
        expiresAt: contentData.expiresAt ? (new Date(contentData.expiresAt) as any) : undefined
      };

      const contentBlock = await contentService.createContentBlock({
        // Ensure required fields exist and correct types per service input
        title: processedData.title || 'Untitled Content Block',
        slug: processedData.slug || (processedData.title || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        type: (processedData.type as any) || ContentBlockType.PAGE,
        content: processedData.content || {},
        isPublished: !!processedData.isPublished,
        publishAt: processedData.publishAt as any,
        expiresAt: processedData.expiresAt as any,
        metaTitle: processedData.metaTitle,
        metaDescription: processedData.metaDescription,
        metaKeywords: processedData.metaKeywords,
        ogImage: processedData.ogImage,
        metadata: processedData.metadata as any,
        sortOrder: processedData.sortOrder,
        parentId: processedData.parentId,
        locale: processedData.locale,
        masterContentBlockId: processedData.masterContentBlockId,
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
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateContentBody }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const userId = (request.user as any)?.id;

      // Convert date strings to Date objects
      const processedData: UpdateContentBody = {
        ...updateData,
        publishAt: updateData.publishAt ? (new Date(updateData.publishAt) as any) : undefined,
        expiresAt: updateData.expiresAt ? (new Date(updateData.expiresAt) as any) : undefined
      };

      const contentBlock = await contentService.updateContentBlock(
        id,
        {
          title: processedData.title,
          slug: processedData.slug,
          type: processedData.type as any,
          content: processedData.content as any,
          isPublished: processedData.isPublished as any,
          publishAt: processedData.publishAt as any,
          expiresAt: processedData.expiresAt as any,
          metaTitle: processedData.metaTitle,
          metaDescription: processedData.metaDescription,
          metaKeywords: processedData.metaKeywords,
          ogImage: processedData.ogImage,
          metadata: processedData.metadata as any,
          sortOrder: processedData.sortOrder,
          parentId: processedData.parentId,
          locale: processedData.locale,
          masterContentBlockId: processedData.masterContentBlockId,
        },
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
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePublicationBody }>, reply: FastifyReply) => {
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
  }, async (request: FastifyRequest<{ Querystring: ContentListQuery }>, reply: FastifyReply) => {
    try {
      const q = request.query;
      const page = typeof q.page === 'string' ? parseInt(q.page, 10) : (q.page || 1);
      const limit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : (q.limit || 10);
      
      const [contentBlocks, total] = await contentService.getContentBlocks(
        {
          page,
          limit,
          sortBy: q.sortBy,
          sortOrder: q.sortOrder
        },
        {
          type: q.type as any,
          isPublished: (typeof q.isPublished === 'string' ? q.isPublished === 'true' : q.isPublished) as any,
          searchTerm: q.searchTerm,
          locale: q.locale
        }
      );

      return reply.status(200).send({
        success: true,
        data: {
          contentBlocks,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
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