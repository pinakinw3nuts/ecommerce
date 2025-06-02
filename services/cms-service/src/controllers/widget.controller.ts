import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ContentService } from '../services/content.service';
import { validateRequest } from '../middleware/validateRequest';
import { ContentBlockType } from '../entities/ContentBlock';
import { logger } from '../utils/logger';

/**
 * Widget types enum
 */
enum WidgetType {
  CAROUSEL = 'carousel',
  POPUP = 'popup',
  BANNER = 'banner',
  FEATURED_PRODUCTS = 'featured_products',
  HERO = 'hero',
  PROMO = 'promo',
  NEWSLETTER = 'newsletter',
  TESTIMONIALS = 'testimonials',
  CATEGORIES = 'categories',
}

// Define request types
interface CreateWidgetRequest extends FastifyRequest {
  body: {
    title: string;
    slug?: string;
    widgetType: WidgetType;
    content: Record<string, any>;
    isPublished?: boolean;
    publishAt?: string;
    expiresAt?: string | null;
    metadata?: Record<string, any>;
    sortOrder?: number;
    locale?: string;
    position?: string;
    displayConditions?: Record<string, any>;
  }
}

// Interface for update widget request
interface UpdateWidgetRequest extends FastifyRequest {
  params: {
    id: string;
  };
  body: {
    title?: string;
    slug?: string;
    widgetType?: WidgetType;
    content?: Record<string, any>;
    isPublished?: boolean;
    publishAt?: string | null;
    expiresAt?: string | null;
    metadata?: Record<string, any>;
    sortOrder?: number;
    locale?: string;
    position?: string;
    displayConditions?: Record<string, any>;
    changeDescription?: string;
  }
}

// Interface for get widgets request
interface GetWidgetsRequest extends FastifyRequest {
  query: {
    type?: WidgetType;
    position?: string;
    locale?: string;
    published?: 'true' | 'false';
    page: number;
    limit: number;
  }
}

// Interface for get widget by ID request
interface GetWidgetByIdRequest extends FastifyRequest {
  params: {
    id: string;
  }
}

interface GetPopupContentRequest extends FastifyRequest {
  params: {
    slug: string;
  }
}

// Interface for update widget positions request
interface UpdateWidgetPositionsRequest extends FastifyRequest {
  body: {
    widgets: Array<{
      id: string;
      sortOrder: number;
      position?: string;
    }>;
  }
}

/**
 * Controller for widget endpoints
 */
export class WidgetController {
  private contentService: ContentService;
  private contextLogger = logger.child({ context: 'WidgetController' });

  constructor() {
    this.contentService = new ContentService();
    this.contextLogger.debug('WidgetController initialized');
  }

  /**
   * Get all widgets
   * @route GET /widget
   */
  getAllWidgets = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      this.contextLogger.debug('Getting all widgets');
      
      // Mock data for now
      const widgets = [
        { id: '1', name: 'Featured Products', type: 'product-list' },
        { id: '2', name: 'Hero Banner', type: 'banner' },
        { id: '3', name: 'Newsletter Signup', type: 'form' }
      ];
      
      return reply.status(200).send({
        success: true,
        data: widgets
      });
    } catch (error) {
      this.contextLogger.error('Failed to get widgets', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to get widgets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get widget by ID
   * @route GET /widget/:id
   */
  getWidgetById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = req.params;
      this.contextLogger.debug('Getting widget by ID', { id });
      
      // Mock data for now
      const widget = { id, name: `Widget ${id}`, type: 'generic' };
      
      return reply.status(200).send({
        success: true,
        data: widget
      });
    } catch (error) {
      this.contextLogger.error('Failed to get widget', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id: req.params.id
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to get widget',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a new widget
   * @route POST /widgets
   */
  createWidget = [
    validateRequest(
      z.object({
        body: z.object({
          title: z.string().min(1).max(200),
          slug: z.string().min(1).max(200).optional(),
          widgetType: z.nativeEnum(WidgetType),
          content: z.record(z.any()).default({}),
          isPublished: z.boolean().optional(),
          publishAt: z.string().datetime().optional(),
          expiresAt: z.string().datetime().optional().nullable(),
          metadata: z.record(z.any()).optional(),
          sortOrder: z.number().int().optional(),
          locale: z.string().min(2).max(10).optional(),
          position: z.string().optional(),
          displayConditions: z.record(z.any()).optional(),
        })
      })
    ),
    async (req: CreateWidgetRequest, reply: FastifyReply) => {
      try {
        const userId = req.headers['x-user-id'] as string;
        const { widgetType, position, displayConditions, ...widgetData } = req.body;
        
        // Map widget type to content block type
        const contentBlockData = {
          ...widgetData,
          type: ContentBlockType.BANNER, // Using BANNER type for widgets
          slug: widgetData.slug || '', // Ensure slug is not undefined
          metadata: {
            ...(widgetData.metadata || {}),
            widgetType,
            position,
            displayConditions
          },
          // Convert date strings to Date objects
          publishAt: widgetData.publishAt ? new Date(widgetData.publishAt) : undefined,
          expiresAt: widgetData.expiresAt ? new Date(widgetData.expiresAt) : undefined
        };
        
        const widget = await this.contentService.createContentBlock(contentBlockData, userId);
        
        this.contextLogger.info('Widget created', { 
          id: widget.id, 
          title: widget.title,
          widgetType
        });
        
        return reply.status(201).send({
          success: true,
          data: widget
        });
      } catch (error) {
        this.contextLogger.error('Failed to create widget', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          body: req.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to create widget',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Update an existing widget
   * @route PUT /widgets/:id
   */
  updateWidget = [
    validateRequest(
      z.object({
        params: z.object({
          id: z.string().uuid()
        }),
        body: z.object({
          title: z.string().min(1).max(200).optional(),
          slug: z.string().min(1).max(200).optional(),
          widgetType: z.nativeEnum(WidgetType).optional(),
          content: z.record(z.any()).optional(),
          isPublished: z.boolean().optional(),
          publishAt: z.string().datetime().optional().nullable(),
          expiresAt: z.string().datetime().optional().nullable(),
          metadata: z.record(z.any()).optional(),
          sortOrder: z.number().int().optional(),
          locale: z.string().min(2).max(10).optional(),
          position: z.string().optional(),
          displayConditions: z.record(z.any()).optional(),
          changeDescription: z.string().optional()
        })
      })
    ),
    async (req: UpdateWidgetRequest, reply: FastifyReply) => {
      try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'] as string;
        const { widgetType, position, displayConditions, changeDescription, ...widgetData } = req.body;
        
        // Get the existing widget to merge metadata
        const existingWidget = await this.contentService.getContentBlockById(id);
        
        if (!existingWidget) {
          return reply.status(404).send({
            success: false,
            message: `Widget with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        // Prepare metadata with widget-specific fields
        const updatedMetadata = {
          ...(existingWidget.metadata || {}),
          ...(widgetData.metadata || {})
        };
        
        if (widgetType) {
          updatedMetadata.widgetType = widgetType;
        }
        
        if (position !== undefined) {
          updatedMetadata.position = position;
        }
        
        if (displayConditions !== undefined) {
          updatedMetadata.displayConditions = displayConditions;
        }
        
        // Update the widget
        const updateData = {
          ...widgetData,
          metadata: updatedMetadata,
          // Convert date strings to Date objects
          publishAt: widgetData.publishAt === null 
            ? null 
            : widgetData.publishAt 
              ? new Date(widgetData.publishAt) 
              : undefined,
          expiresAt: widgetData.expiresAt === null 
            ? null 
            : widgetData.expiresAt 
              ? new Date(widgetData.expiresAt) 
              : undefined
        };
        
        const widget = await this.contentService.updateContentBlock(
          id, 
          updateData, 
          userId,
          changeDescription
        );
        
        this.contextLogger.info('Widget updated', { 
          id: widget.id, 
          title: widget.title 
        });
        
        return reply.status(200).send({
          success: true,
          data: widget
        });
      } catch (error) {
        this.contextLogger.error('Failed to update widget', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: req.params.id,
          body: req.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to update widget',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Get all widgets by type
   * @route GET /widgets
   */
  getWidgets = [
    validateRequest(
      z.object({
        query: z.object({
          type: z.nativeEnum(WidgetType).optional(),
          position: z.string().optional(),
          locale: z.string().optional(),
          published: z.enum(['true', 'false']).optional().default('true'),
          page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
          limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10')
        })
      })
    ),
    async (req: GetWidgetsRequest, reply: FastifyReply) => {
      try {
        const { type, position, locale, published, page, limit } = req.query;
        const isPublished = published === 'true';
        
        // Build metadata filter for widget type and position
        const metadataFilter: Record<string, any> = {};
        
        if (type) {
          metadataFilter.widgetType = type;
        }
        
        if (position) {
          metadataFilter.position = position;
        }
        
        // Get widgets with pagination
        const [widgets, total] = await this.contentService.getContentBlocks(
          { 
            page: page || 1,
            limit: limit || 10,
            sortBy: 'sortOrder', 
            sortOrder: 'ASC' 
          },
          { 
            type: ContentBlockType.BANNER,
            isPublished,
            locale,
            // We can't directly filter by metadata fields in the service,
            // so we'll filter the results after fetching
          }
        );
        
        // Filter by metadata if needed
        let filteredWidgets = widgets;
        if (Object.keys(metadataFilter).length > 0) {
          filteredWidgets = widgets.filter(widget => {
            // Check if widget metadata matches all filter criteria
            return Object.entries(metadataFilter).every(([key, value]) => 
              widget.metadata && widget.metadata[key] === value
            );
          });
        }
        
        const pageNumber = page || 1;
        const limitNumber = limit || 10;
        
        return reply.status(200).send({
          success: true,
          data: filteredWidgets,
          meta: {
            page: pageNumber,
            limit: limitNumber,
            total: Object.keys(metadataFilter).length > 0 ? filteredWidgets.length : total,
            totalPages: Math.ceil((Object.keys(metadataFilter).length > 0 ? filteredWidgets.length : total) / limitNumber)
          }
        });
      } catch (error) {
        this.contextLogger.error('Failed to get widgets', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          query: req.query
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get widgets',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Get active widgets for homepage
   * @route GET /widgets/homepage
   */
  getHomepageWidgets = [
    validateRequest(
      z.object({
        query: z.object({
          locale: z.string().optional(),
        })
      })
    ),
    async (req: GetWidgetsRequest, reply: FastifyReply) => {
      try {
        const { locale } = req.query;
        
        // Get all published widgets
        const [widgets, _] = await this.contentService.getContentBlocks(
          { page: 1, limit: 100, sortBy: 'sortOrder', sortOrder: 'ASC' },
          { 
            type: ContentBlockType.BANNER,
            isPublished: true,
            locale
          }
        );
        
        // Group widgets by their position and type
        const groupedWidgets: Record<string, any[]> = {};
        
        widgets.forEach(widget => {
          if (!widget.metadata?.widgetType || !widget.metadata?.position) {
            return;
          }
          
          const position = widget.metadata.position as string;
          
          if (!groupedWidgets[position]) {
            groupedWidgets[position] = [];
          }
          
          groupedWidgets[position].push(widget);
        });
        
        this.contextLogger.info('Homepage widgets fetched', { 
          count: widgets.length,
          positions: Object.keys(groupedWidgets)
        });
        
        return reply.status(200).send({
          success: true,
          data: groupedWidgets
        });
      } catch (error) {
        this.contextLogger.error('Failed to get homepage widgets', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          locale: req.query.locale
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to get homepage widgets',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Delete a widget
   * @route DELETE /widgets/:id
   */
  deleteWidget = [
    validateRequest(
      z.object({
        params: z.object({
          id: z.string().uuid()
        })
      })
    ),
    async (req: GetWidgetByIdRequest, reply: FastifyReply) => {
      try {
        const { id } = req.params;
        
        // Check if the widget exists
        const widget = await this.contentService.getContentBlockById(id);
        
        if (!widget) {
          return reply.status(404).send({
            success: false,
            message: `Widget with ID ${id} not found`,
            error: 'NOT_FOUND'
          });
        }
        
        // Delete the widget
        await this.contentService.deleteContentBlock(id);
        
        this.contextLogger.info('Widget deleted', { id });
        
        return reply.status(200).send({
          success: true,
          message: 'Widget deleted successfully'
        });
      } catch (error) {
        this.contextLogger.error('Failed to delete widget', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          id: req.params.id
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to delete widget',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Update widget positions (batch update for sorting)
   * @route PUT /widgets/positions
   */
  updateWidgetPositions = [
    validateRequest(
      z.object({
        body: z.object({
          widgets: z.array(z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int(),
            position: z.string().optional()
          }))
        })
      })
    ),
    async (req: UpdateWidgetPositionsRequest, reply: FastifyReply) => {
      try {
        const { widgets } = req.body;
        const userId = req.headers['x-user-id'] as string;
        
        // Process each widget update in sequence
        const updatedWidgets = [];
        
        for (const widget of widgets) {
          const { id, sortOrder, position } = widget;
          
          // Get the existing widget
          const existingWidget = await this.contentService.getContentBlockById(id);
          
          if (!existingWidget) {
            this.contextLogger.warn(`Widget with ID ${id} not found during position update`);
            continue;
          }
          
          // Prepare update data
          const updateData: any = { sortOrder };
          
          // Update position in metadata if provided
          if (position) {
            updateData.metadata = {
              ...existingWidget.metadata,
              position
            };
          }
          
          // Update the widget
          const updatedWidget = await this.contentService.updateContentBlock(
            id,
            updateData,
            userId,
            'Updated widget position/order'
          );
          
          updatedWidgets.push(updatedWidget);
        }
        
        this.contextLogger.info('Widget positions updated', { 
          count: updatedWidgets.length
        });
        
        return reply.status(200).send({
          success: true,
          message: `${updatedWidgets.length} widget positions updated successfully`,
          data: updatedWidgets
        });
      } catch (error) {
        this.contextLogger.error('Failed to update widget positions', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          body: req.body
        });
        
        return reply.status(500).send({
          success: false,
          message: 'Failed to update widget positions',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Get home page content
   * @route GET /widget/home
   */
  getHomeContent = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const homeContent = await this.contentService.getPublishedContentBlockBySlug('home');
      
      if (!homeContent) {
        return reply.status(404).send({
          success: false,
          message: "Home page content not found",
          error: 'NOT_FOUND'
        });
      }
      
      return reply.status(200).send({
        success: true,
        data: homeContent
      });
    } catch (error) {
      this.contextLogger.error('Failed to get home page content', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to get home page content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get popup content by slug
   * @route GET /widget/popup/:slug
   */
  getPopupContent = async (req: GetPopupContentRequest, reply: FastifyReply) => {
    try {
      const { slug } = req.params;
      
      const popupContent = await this.contentService.getPublishedContentBlockBySlugAndType(
        slug,
        ContentBlockType.BANNER
      );
      
      if (!popupContent) {
        return reply.status(404).send({
          success: false,
          message: `Popup content with slug "${slug}" not found`,
          error: 'NOT_FOUND'
        });
      }
      
      return reply.status(200).send({
        success: true,
        data: popupContent
      });
    } catch (error) {
      this.contextLogger.error('Failed to get popup content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        slug: req.params.slug
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to get popup content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 