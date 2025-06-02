import { FastifyInstance, FastifyRequest } from 'fastify';
import { ContentService } from '../services/content.service';
import { ContentBlockType } from '../entities/ContentBlock';
import { logger } from '../utils/logger';
import { roleGuard } from '../middleware/roleGuard';

// Define request types
interface CreateContentRequest extends FastifyRequest {
  body: {
    title: string;
    slug?: string;
    type: ContentBlockType;
    content: Record<string, any>;
    isPublished?: boolean;
    publishAt?: string;
    expiresAt?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    metadata?: Record<string, any>;
    sortOrder?: number;
    parentId?: string;
    locale?: string;
    masterContentBlockId?: string;
  }
}

interface UpdateContentRequest extends FastifyRequest {
  params: {
    id: string;
  };
  body: {
    title?: string;
    slug?: string;
    type?: ContentBlockType;
    content?: Record<string, any>;
    isPublished?: boolean;
    publishAt?: string | null;
    expiresAt?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    ogImage?: string | null;
    metadata?: Record<string, any>;
    sortOrder?: number;
    parentId?: string | null;
    locale?: string;
    masterContentBlockId?: string | null;
    changeDescription?: string;
  }
}

/**
 * Controller for content management endpoints
 */
class ContentControllerClass {
  public contentService: ContentService;
  public contextLogger = logger.child({ context: 'ContentController' });

  constructor() {
    this.contentService = new ContentService();
  }
  
  /**
   * Register public routes (read-only)
   */
  registerPublicRoutes = async (fastify: FastifyInstance) => {
    // Get published content by slug (public)
    fastify.get('/by-slug/:slug', {
      schema: {
        tags: ['Content'],
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
            type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] }
          }
        }
      }
    }, async (request, reply) => {
      try {
        const { slug } = request.params as { slug: string };
        const { locale } = request.query as { locale?: string };
        
        // Only allow published content in public routes
        const contentBlock = await this.contentService.getPublishedContentBlockBySlug(slug, locale);
        
        if (!contentBlock) {
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
        this.contextLogger.error('Failed to get content by slug', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          slug: (request.params as { slug: string }).slug
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get content by slug',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Get published content by ID (public)
    fastify.get('/:id', {
      schema: {
        tags: ['Content'],
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
    }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        // First get the content block
        const contentBlock = await this.contentService.getContentBlockById(id);
        
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
        this.contextLogger.error('Failed to get content by ID', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as { id: string }).id
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get content by ID',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  };
  
  /**
   * Register protected routes (admin/editor only)
   */
  registerProtectedRoutes = async (fastify: FastifyInstance) => {
    // Get all content blocks (admin/editor)
    fastify.get('/', {
      schema: {
        tags: ['Content'],
        summary: 'Get all content blocks',
        description: 'Retrieve a list of all content blocks with filtering and pagination',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['ASC', 'DESC'] },
            type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
            isPublished: { type: 'string' },
            searchTerm: { type: 'string' },
            locale: { type: 'string' }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const query = request.query as any;
        
        // Parse and validate query parameters
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '10', 10);
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'DESC';
        
        // Build filter options
        const filters = {
          type: query.type as ContentBlockType | undefined,
          isPublished: query.isPublished === 'true' ? true : 
                      query.isPublished === 'false' ? false : undefined,
          searchTerm: query.searchTerm,
          locale: query.locale
        };
        
        const [contentBlocks, total] = await this.contentService.getContentBlocks(
          { page, limit, sortBy, sortOrder },
          filters
        );
        
        // Set content-range header for pagination
        reply.header('Content-Range', `content ${(page - 1) * limit}-${Math.min(page * limit, total)}/${total}`);
        
        return reply.status(200).send({
          success: true,
          data: contentBlocks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        this.contextLogger.error('Failed to get content blocks', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          query: request.query
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get content blocks',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Get content block by ID (admin/editor)
    fastify.get('/:id', {
      schema: {
        tags: ['Content'],
        summary: 'Get content block by ID',
        description: 'Retrieve a specific content block by its ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const contentBlock = await this.contentService.getContentBlockById(id);
        
        if (!contentBlock) {
          return reply.status(404).send({
            success: false,
            message: `Content block with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        return reply.status(200).send({
          success: true,
          data: contentBlock
        });
      } catch (error) {
        this.contextLogger.error('Failed to get content block', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as { id: string }).id
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get content block',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Create content block (admin/editor)
    fastify.post('/', {
      schema: {
        tags: ['Content'],
        summary: 'Create a new content block',
        description: 'Create a new content block with the provided details',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['title', 'type', 'content'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            slug: { type: 'string', minLength: 1, maxLength: 200 },
            type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
            content: { type: 'object', additionalProperties: true },
            isPublished: { type: 'boolean' },
            publishAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            metaTitle: { type: 'string', maxLength: 100 },
            metaDescription: { type: 'string', maxLength: 250 },
            metaKeywords: { type: 'string' },
            ogImage: { type: 'string' },
            metadata: { type: 'object', additionalProperties: true },
            sortOrder: { type: 'integer' },
            parentId: { type: 'string', format: 'uuid' },
            locale: { type: 'string', minLength: 2, maxLength: 10 },
            masterContentBlockId: { type: 'string', format: 'uuid' }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const userId = request.headers['x-user-id'] as string;
        const body = request.body as CreateContentRequest['body'];
        
        // Transform request body to match CreateContentBlockInput
        const contentData = {
          ...body,
          // Convert string dates to Date objects if present
          publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
          // Ensure slug is present (will be generated by service if undefined)
          slug: body.slug || ''
        };
        
        const contentBlock = await this.contentService.createContentBlock(contentData, userId);
        
        this.contextLogger.info('Content block created', { 
          id: contentBlock.id, 
          title: contentBlock.title 
        });
        
        return reply.status(201).send({
          success: true,
          data: contentBlock
        });
      } catch (error) {
        this.contextLogger.error('Failed to create content block', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          body: request.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to create content block',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Update content block (admin/editor)
    fastify.put('/:id', {
      schema: {
        tags: ['Content'],
        summary: 'Update a content block',
        description: 'Update an existing content block by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            slug: { type: 'string', minLength: 1, maxLength: 200 },
            type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
            content: { type: 'object', additionalProperties: true },
            isPublished: { type: 'boolean' },
            publishAt: { type: 'string', format: 'date-time', nullable: true },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            metaTitle: { type: 'string', maxLength: 100, nullable: true },
            metaDescription: { type: 'string', maxLength: 250, nullable: true },
            metaKeywords: { type: 'string', nullable: true },
            ogImage: { type: 'string', nullable: true },
            metadata: { type: 'object', additionalProperties: true },
            sortOrder: { type: 'integer' },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            locale: { type: 'string', minLength: 2, maxLength: 10 },
            masterContentBlockId: { type: 'string', format: 'uuid', nullable: true },
            changeDescription: { type: 'string' }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.headers['x-user-id'] as string;
        const body = request.body as UpdateContentRequest['body'];
        
        // Transform request body
        const updateData = {
          ...body,
          // Convert string dates to Date objects if present
          publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
        };
        
        const contentBlock = await this.contentService.updateContentBlock(
          id, 
          updateData, 
          userId,
          body.changeDescription
        );
        
        if (!contentBlock) {
          return reply.status(404).send({
            success: false,
            message: `Content block with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        this.contextLogger.info('Content block updated', { 
          id: contentBlock.id, 
          title: contentBlock.title 
        });
        
        return reply.status(200).send({
          success: true,
          data: contentBlock
        });
      } catch (error) {
        this.contextLogger.error('Failed to update content block', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as { id: string }).id,
          body: request.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to update content block',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Delete content block (admin/editor)
    fastify.delete('/:id', {
      schema: {
        tags: ['Content'],
        summary: 'Delete a content block',
        description: 'Delete a content block by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const result = await this.contentService.deleteContentBlock(id);
        
        if (!result) {
          return reply.status(404).send({
            success: false,
            message: `Content block with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        this.contextLogger.info('Content block deleted', { id });
        
        return reply.status(200).send({
          success: true,
          message: `Content block with ID ${id} deleted successfully`
        });
      } catch (error) {
        this.contextLogger.error('Failed to delete content block', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as { id: string }).id
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete content block',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Toggle publish status (admin/editor)
    fastify.patch('/:id/publish', {
      schema: {
        tags: ['Content'],
        summary: 'Toggle publish status',
        description: 'Toggle the publish status of a content block',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['isPublished'],
          properties: {
            isPublished: { type: 'boolean' },
            publishAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { isPublished } = request.body as { isPublished: boolean };
        const userId = request.headers['x-user-id'] as string;
        
        // Use the updatePublicationStatus method instead of togglePublishStatus
        const contentBlock = await this.contentService.updatePublicationStatus(
          id, 
          isPublished,
          userId
        );
        
        if (!contentBlock) {
          return reply.status(404).send({
            success: false,
            message: `Content block with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        this.contextLogger.info(`Content block ${isPublished ? 'published' : 'unpublished'}`, { 
          id: contentBlock.id, 
          title: contentBlock.title 
        });
        
        return reply.status(200).send({
          success: true,
          data: contentBlock
        });
      } catch (error) {
        this.contextLogger.error('Failed to toggle publish status', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: (request.params as { id: string }).id,
          body: request.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to toggle publish status',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Get content by slug (admin/editor)
    fastify.get('/by-slug/:slug', {
      schema: {
        tags: ['Content'],
        summary: 'Get content by slug',
        description: 'Retrieve content by its slug (including unpublished)',
        security: [{ bearerAuth: [] }],
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
            type: { type: 'string', enum: ['page', 'section', 'banner', 'blog_post', 'product', 'category', 'faq'] },
            published: { type: 'string', enum: ['true', 'false'] }
          }
        }
      },
      preHandler: roleGuard(['admin', 'editor'])
    }, async (request, reply) => {
      try {
        const { slug } = request.params as { slug: string };
        const { locale, type, published } = request.query as { 
          locale?: string, 
          type?: ContentBlockType,
          published?: 'true' | 'false'
        };
        
        const isPublished = published === 'true' ? true : 
                           published === 'false' ? false : undefined;
        
        // Use the correct method signature
        const contentBlock = await this.contentService.getContentBlockBySlug(slug, locale);
        
        if (!contentBlock) {
          return reply.status(404).send({
            success: false,
            message: `Content with slug '${slug}' not found`,
            error: 'NOT_FOUND'
          });
        }
        
        // Filter by publication status if requested
        if (isPublished !== undefined && contentBlock.isPublished !== isPublished) {
          return reply.status(404).send({
            success: false,
            message: `Content with slug '${slug}' and requested publication status not found`,
            error: 'NOT_FOUND'
          });
        }
        
        // Filter by type if requested
        if (type && contentBlock.type !== type) {
          return reply.status(404).send({
            success: false,
            message: `Content with slug '${slug}' and type '${type}' not found`,
            error: 'NOT_FOUND'
          });
        }
        
        return reply.status(200).send({
          success: true,
          data: contentBlock
        });
      } catch (error) {
        this.contextLogger.error('Failed to get content by slug', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          slug: (request.params as { slug: string }).slug
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get content by slug',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  };
}

// Export a singleton instance
export const ContentController = new ContentControllerClass(); 