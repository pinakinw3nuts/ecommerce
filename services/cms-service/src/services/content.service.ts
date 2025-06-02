import { Repository, FindOptionsWhere, Between, FindOptionsOrder, IsNull, Not, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { ContentBlock, ContentBlockType, CreateContentBlockInput, UpdateContentBlockInput } from '../entities/ContentBlock';
import { ContentRevision, CreateContentRevisionInput } from '../entities/ContentRevision';
import { logger } from '../utils/logger';
import { SlugService } from './slug.service';

/**
 * Pagination options for content queries
 */
export interface ContentPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Content search/filter options
 */
export interface ContentFilterOptions {
  type?: ContentBlockType;
  isPublished?: boolean;
  searchTerm?: string;
  locale?: string;
  publishedAfter?: Date;
  publishedBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  parentId?: string | null;
}

/**
 * Service for managing content blocks
 */
export class ContentService {
  private contentRepository: Repository<ContentBlock>;
  private revisionRepository: Repository<ContentRevision>;
  private slugService: SlugService;
  private contextLogger = logger.child({ context: 'ContentService' });

  constructor() {
    this.contentRepository = AppDataSource.getRepository(ContentBlock);
    this.revisionRepository = AppDataSource.getRepository(ContentRevision);
    this.slugService = new SlugService();
  }

  /**
   * Create a new content block
   * @param input - Content block data
   * @param userId - ID of the user creating the content
   * @returns The created content block
   */
  async createContentBlock(input: CreateContentBlockInput, userId?: string): Promise<ContentBlock> {
    try {
      // Generate a unique slug if not provided
      if (!input.slug) {
        input.slug = await this.slugService.generateUniqueSlug(input.title, input.type);
      } else {
        // Normalize and check if the provided slug is unique
        const normalizedSlug = this.slugService.normalizeSlug(input.slug);
        
        if (!(await this.slugService.isSlugUnique(normalizedSlug, input.type))) {
          // If not unique, generate a unique version
          input.slug = await this.slugService.generateUniqueSlug(normalizedSlug, input.type);
        } else {
          input.slug = normalizedSlug;
        }
      }

      // Create the content block
      const contentBlock = this.contentRepository.create({
        ...input,
        createdBy: userId,
        updatedBy: userId,
      });

      // Save the content block
      const savedContentBlock = await this.contentRepository.save(contentBlock);
      
      this.contextLogger.info('Content block created', { 
        id: savedContentBlock.id, 
        title: savedContentBlock.title,
        type: savedContentBlock.type,
        slug: savedContentBlock.slug,
        userId 
      });

      // Create the initial revision
      await this.createRevision(savedContentBlock, 1, 'Initial version', userId);

      return savedContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to create content block', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        input,
        userId
      });
      throw new Error('Failed to create content block');
    }
  }

  /**
   * Update an existing content block
   * @param id - ID of the content block to update
   * @param input - Updated content block data
   * @param userId - ID of the user updating the content
   * @param changeDescription - Description of the changes made
   * @returns The updated content block
   */
  async updateContentBlock(
    id: string, 
    input: UpdateContentBlockInput, 
    userId?: string,
    changeDescription?: string
  ): Promise<ContentBlock> {
    try {
      // Find the content block
      const contentBlock = await this.contentRepository.findOne({
        where: { id }
      });

      if (!contentBlock) {
        throw new Error(`Content block with ID ${id} not found`);
      }

      // Check if slug is being updated and needs to be unique
      if (input.slug && input.slug !== contentBlock.slug) {
        const normalizedSlug = this.slugService.normalizeSlug(input.slug);
        
        if (!(await this.slugService.isSlugUnique(normalizedSlug, contentBlock.type, id))) {
          // If not unique, generate a unique version
          input.slug = await this.slugService.generateUniqueSlug(
            normalizedSlug, 
            contentBlock.type, 
            {}, 
            id
          );
        } else {
          input.slug = normalizedSlug;
        }
      }

      // Get the current version number
      const latestRevision = await this.revisionRepository.findOne({
        where: { contentBlockId: id },
        order: { version: 'DESC' }
      });

      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

      // Create a revision before updating
      await this.createRevision(
        contentBlock, 
        nextVersion, 
        changeDescription || 'Content updated', 
        userId
      );

      // Update the content block
      this.contentRepository.merge(contentBlock, {
        ...input,
        updatedBy: userId,
        // Convert nullable dates to undefined for TypeORM compatibility
        publishAt: input.publishAt === null ? undefined : input.publishAt,
        expiresAt: input.expiresAt === null ? undefined : input.expiresAt,
        metaTitle: input.metaTitle === null ? undefined : input.metaTitle,
        metaDescription: input.metaDescription === null ? undefined : input.metaDescription,
        metaKeywords: input.metaKeywords === null ? undefined : input.metaKeywords,
        ogImage: input.ogImage === null ? undefined : input.ogImage,
        parentId: input.parentId === null ? undefined : input.parentId,
        masterContentBlockId: input.masterContentBlockId === null ? undefined : input.masterContentBlockId
      });

      // Save the updated content block
      const updatedContentBlock = await this.contentRepository.save(contentBlock);
      
      this.contextLogger.info('Content block updated', { 
        id: updatedContentBlock.id, 
        title: updatedContentBlock.title,
        slug: updatedContentBlock.slug,
        version: nextVersion,
        userId 
      });

      return updatedContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to update content block', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        input,
        userId
      });
      throw new Error(`Failed to update content block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a content block by ID
   * @param id - ID of the content block
   * @returns The content block
   */
  async getContentBlockById(id: string): Promise<ContentBlock | null> {
    try {
      return await this.contentRepository.findOne({
        where: { id }
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content block by ID', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw new Error('Failed to get content block');
    }
  }

  /**
   * Get a content block by slug and type
   * @param slug - Slug of the content block
   * @param type - Type of content block
   * @param locale - Optional locale for internationalized content
   * @returns The content block
   */
  async getContentBlockBySlugAndType(
    slug: string, 
    type: ContentBlockType,
    locale?: string
  ): Promise<ContentBlock | null> {
    try {
      const query: FindOptionsWhere<ContentBlock> = { 
        slug,
        type
      };
      
      if (locale) {
        query.locale = locale;
      }
      
      return await this.contentRepository.findOne({
        where: query
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content block by slug and type', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        type,
        locale
      });
      throw new Error('Failed to get content block');
    }
  }

  /**
   * Get a content block by slug
   * @param slug - Slug of the content block
   * @param locale - Optional locale for internationalized content
   * @returns The content block
   */
  async getContentBlockBySlug(slug: string, locale?: string): Promise<ContentBlock | null> {
    try {
      const query: FindOptionsWhere<ContentBlock> = { slug };
      
      if (locale) {
        query.locale = locale;
      }
      
      return await this.contentRepository.findOne({
        where: query
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content block by slug', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        locale
      });
      throw new Error('Failed to get content block');
    }
  }

  /**
   * Get a content block by URL path
   * @param path - URL path (e.g., "/about" or "/pages/contact")
   * @param locale - Optional locale for internationalized content
   * @returns The content block or null if not found
   */
  async getContentBlockByPath(path: string, locale?: string): Promise<ContentBlock | null> {
    try {
      // Parse the path to get content type and slug
      const parsed = this.slugService.parseUrlPath(path);
      
      if (!parsed) {
        return null;
      }
      
      // Get the content block by slug and type
      return this.getContentBlockBySlugAndType(parsed.slug, parsed.contentType, locale);
    } catch (error) {
      this.contextLogger.error('Failed to get content block by path', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path,
        locale
      });
      throw new Error('Failed to get content block by path');
    }
  }

  /**
   * Get published content block by slug
   * Only returns the content if it's published
   * @param slug - Slug of the content block
   * @param locale - Optional locale for internationalized content
   * @returns The published content block or null
   */
  async getPublishedContentBlockBySlug(slug: string, locale?: string): Promise<ContentBlock | null> {
    try {
      const query: FindOptionsWhere<ContentBlock> = { 
        slug,
        isPublished: true
      };
      
      if (locale) {
        query.locale = locale;
      }
      
      // Also check publication date constraints if the content is scheduled
      const now = new Date();
      
      const content = await this.contentRepository.findOne({
        where: [
          { ...query, publishAt: IsNull() },
          { ...query, publishAt: Not(IsNull()) && Between(new Date(0), now) }
        ]
      });
      
      // Check if the content has expired
      if (content && content.expiresAt && content.expiresAt < now) {
        return null;
      }
      
      return content;
    } catch (error) {
      this.contextLogger.error('Failed to get published content block', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        locale
      });
      throw new Error('Failed to get published content block');
    }
  }

  /**
   * Get published content block by URL path
   * @param path - URL path (e.g., "/about" or "/pages/contact")
   * @param locale - Optional locale for internationalized content
   * @returns The published content block or null if not found
   */
  async getPublishedContentBlockByPath(path: string, locale?: string): Promise<ContentBlock | null> {
    try {
      // Parse the path to get content type and slug
      const parsed = this.slugService.parseUrlPath(path);
      
      if (!parsed) {
        return null;
      }
      
      // Build query for published content
      const query: FindOptionsWhere<ContentBlock> = { 
        slug: parsed.slug,
        type: parsed.contentType,
        isPublished: true
      };
      
      if (locale) {
        query.locale = locale;
      }
      
      // Check publication date constraints
      const now = new Date();
      
      const content = await this.contentRepository.findOne({
        where: [
          { ...query, publishAt: IsNull() },
          { ...query, publishAt: Not(IsNull()) && Between(new Date(0), now) }
        ]
      });
      
      // Check if the content has expired
      if (content && content.expiresAt && content.expiresAt < now) {
        return null;
      }
      
      return content;
    } catch (error) {
      this.contextLogger.error('Failed to get published content block by path', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path,
        locale
      });
      throw new Error('Failed to get published content block by path');
    }
  }

  /**
   * Get published content block by slug and type
   * Only returns the content if it's published
   * @param slug - Slug of the content block
   * @param type - Type of content block
   * @param locale - Optional locale for internationalized content
   * @returns The published content block or null
   */
  async getPublishedContentBlockBySlugAndType(
    slug: string, 
    type: ContentBlockType,
    locale?: string
  ): Promise<ContentBlock | null> {
    try {
      const query: FindOptionsWhere<ContentBlock> = { 
        slug,
        type,
        isPublished: true
      };
      
      if (locale) {
        query.locale = locale;
      }
      
      // Also check publication date constraints if the content is scheduled
      const now = new Date();
      
      const content = await this.contentRepository.findOne({
        where: [
          { ...query, publishAt: IsNull() },
          { ...query, publishAt: Not(IsNull()) && Between(new Date(0), now) }
        ]
      });
      
      // Check if the content has expired
      if (content && content.expiresAt && content.expiresAt < now) {
        return null;
      }
      
      return content;
    } catch (error) {
      this.contextLogger.error('Failed to get published content block by slug and type', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        type,
        locale
      });
      throw new Error('Failed to get published content block');
    }
  }

  /**
   * Get all content blocks with pagination and filtering
   * @param options - Pagination options
   * @param filters - Filter options
   * @returns Array of content blocks and total count
   */
  async getContentBlocks(
    options: ContentPaginationOptions,
    filters: ContentFilterOptions = {}
  ): Promise<[ContentBlock[], number]> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
      
      // Build query conditions
      const whereConditions: FindOptionsWhere<ContentBlock> = {};
      
      if (filters.type !== undefined) {
        whereConditions.type = filters.type;
      }
      
      if (filters.isPublished !== undefined) {
        whereConditions.isPublished = filters.isPublished;
      }
      
      if (filters.locale) {
        whereConditions.locale = filters.locale;
      }
      
      if (filters.parentId !== undefined) {
        whereConditions.parentId = filters.parentId === null ? IsNull() : filters.parentId;
      }
      
      // Date range filters
      if (filters.publishedAfter || filters.publishedBefore) {
        if (filters.publishedAfter && filters.publishedBefore) {
          whereConditions.publishAt = Between(filters.publishedAfter, filters.publishedBefore);
        } else if (filters.publishedAfter) {
          whereConditions.publishAt = MoreThanOrEqual(filters.publishedAfter);
        } else if (filters.publishedBefore) {
          whereConditions.publishAt = LessThanOrEqual(filters.publishedBefore);
        }
      }
      
      if (filters.createdAfter || filters.createdBefore) {
        if (filters.createdAfter && filters.createdBefore) {
          whereConditions.createdAt = Between(filters.createdAfter, filters.createdBefore);
        } else if (filters.createdAfter) {
          whereConditions.createdAt = MoreThanOrEqual(filters.createdAfter);
        } else if (filters.createdBefore) {
          whereConditions.createdAt = LessThanOrEqual(filters.createdBefore);
        }
      }
      
      // Handle search term
      if (filters.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`;
        
        // Find content blocks with matching title or slug
        return await this.contentRepository.findAndCount({
          where: [
            { ...whereConditions, title: Like(searchTerm) },
            { ...whereConditions, slug: Like(searchTerm) },
            { ...whereConditions, metaTitle: Like(searchTerm) },
            { ...whereConditions, metaDescription: Like(searchTerm) }
          ],
          order: { [sortBy]: sortOrder } as FindOptionsOrder<ContentBlock>,
          skip: (page - 1) * limit,
          take: limit
        });
      }
      
      // Regular query without search term
      return await this.contentRepository.findAndCount({
        where: whereConditions,
        order: { [sortBy]: sortOrder } as FindOptionsOrder<ContentBlock>,
        skip: (page - 1) * limit,
        take: limit
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content blocks', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
        filters
      });
      throw new Error('Failed to get content blocks');
    }
  }

  /**
   * Publish or unpublish a content block
   * @param id - ID of the content block
   * @param isPublished - Whether to publish or unpublish
   * @param userId - ID of the user publishing/unpublishing
   * @returns The updated content block
   */
  async updatePublicationStatus(
    id: string, 
    isPublished: boolean, 
    userId?: string
  ): Promise<ContentBlock> {
    try {
      const contentBlock = await this.contentRepository.findOne({
        where: { id }
      });

      if (!contentBlock) {
        throw new Error(`Content block with ID ${id} not found`);
      }

      // If the status hasn't changed, just return the content block
      if (contentBlock.isPublished === isPublished) {
        return contentBlock;
      }

      // Create a revision for this change
      const latestRevision = await this.revisionRepository.findOne({
        where: { contentBlockId: id },
        order: { version: 'DESC' }
      });

      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;
      const changeDescription = isPublished ? 'Content published' : 'Content unpublished';

      await this.createRevision(
        contentBlock, 
        nextVersion, 
        changeDescription, 
        userId
      );

      // Update the publication status
      contentBlock.isPublished = isPublished;
      contentBlock.updatedBy = userId;
      
      // If publishing, set the publishAt date to now if it's not already set
      if (isPublished && !contentBlock.publishAt) {
        contentBlock.publishAt = new Date();
      }

      const updatedContentBlock = await this.contentRepository.save(contentBlock);
      
      this.contextLogger.info(`Content block ${isPublished ? 'published' : 'unpublished'}`, { 
        id: updatedContentBlock.id, 
        title: updatedContentBlock.title,
        userId 
      });

      return updatedContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to update publication status', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        isPublished,
        userId
      });
      throw new Error('Failed to update publication status');
    }
  }

  /**
   * Schedule content block publication
   * @param id - ID of the content block
   * @param publishAt - Date to publish the content
   * @param expiresAt - Optional date when the content expires
   * @param userId - ID of the user scheduling the publication
   * @returns The updated content block
   */
  async schedulePublication(
    id: string, 
    publishAt: Date, 
    expiresAt?: Date | null, 
    userId?: string
  ): Promise<ContentBlock> {
    try {
      const contentBlock = await this.contentRepository.findOne({
        where: { id }
      });

      if (!contentBlock) {
        throw new Error(`Content block with ID ${id} not found`);
      }

      // Create a revision for this change
      const latestRevision = await this.revisionRepository.findOne({
        where: { contentBlockId: id },
        order: { version: 'DESC' }
      });

      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;
      
      await this.createRevision(
        contentBlock, 
        nextVersion, 
        'Publication scheduled', 
        userId
      );

      // Update the publication schedule
      contentBlock.publishAt = publishAt;
      contentBlock.expiresAt = expiresAt === undefined ? contentBlock.expiresAt : (expiresAt === null ? undefined : expiresAt);
      contentBlock.updatedBy = userId;

      const updatedContentBlock = await this.contentRepository.save(contentBlock);
      
      this.contextLogger.info('Content block publication scheduled', { 
        id: updatedContentBlock.id, 
        title: updatedContentBlock.title,
        publishAt,
        expiresAt,
        userId 
      });

      return updatedContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to schedule publication', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        publishAt,
        expiresAt,
        userId
      });
      throw new Error('Failed to schedule publication');
    }
  }

  /**
   * Delete a content block
   * @param id - ID of the content block to delete
   * @returns True if the content block was deleted
   */
  async deleteContentBlock(id: string): Promise<boolean> {
    try {
      const result = await this.contentRepository.delete(id);
      
      const deleted = result.affected ? result.affected > 0 : false;
      
      if (deleted) {
        this.contextLogger.info('Content block deleted', { id });
        
        // Delete all revisions
        await this.revisionRepository.delete({ contentBlockId: id });
      }
      
      return deleted;
    } catch (error) {
      this.contextLogger.error('Failed to delete content block', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw new Error('Failed to delete content block');
    }
  }

  /**
   * Update SEO metadata for a content block
   * @param id - ID of the content block
   * @param seoData - SEO metadata
   * @param userId - ID of the user updating the SEO data
   * @returns The updated content block
   */
  async updateSeoMetadata(
    id: string, 
    seoData: {
      metaTitle?: string | null;
      metaDescription?: string | null;
      metaKeywords?: string | null;
      ogImage?: string | null;
    },
    userId?: string
  ): Promise<ContentBlock> {
    try {
      const contentBlock = await this.contentRepository.findOne({
        where: { id }
      });

      if (!contentBlock) {
        throw new Error(`Content block with ID ${id} not found`);
      }

      // Create a revision for this change
      const latestRevision = await this.revisionRepository.findOne({
        where: { contentBlockId: id },
        order: { version: 'DESC' }
      });

      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;
      
      await this.createRevision(
        contentBlock, 
        nextVersion, 
        'SEO metadata updated', 
        userId
      );

      // Update the SEO metadata
      contentBlock.metaTitle = seoData.metaTitle === undefined ? contentBlock.metaTitle : (seoData.metaTitle === null ? undefined : seoData.metaTitle);
      contentBlock.metaDescription = seoData.metaDescription === undefined ? contentBlock.metaDescription : (seoData.metaDescription === null ? undefined : seoData.metaDescription);
      contentBlock.metaKeywords = seoData.metaKeywords === undefined ? contentBlock.metaKeywords : (seoData.metaKeywords === null ? undefined : seoData.metaKeywords);
      contentBlock.ogImage = seoData.ogImage === undefined ? contentBlock.ogImage : (seoData.ogImage === null ? undefined : seoData.ogImage);
      contentBlock.updatedBy = userId;

      const updatedContentBlock = await this.contentRepository.save(contentBlock);
      
      this.contextLogger.info('Content block SEO metadata updated', { 
        id: updatedContentBlock.id, 
        title: updatedContentBlock.title,
        userId 
      });

      return updatedContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to update SEO metadata', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        seoData,
        userId
      });
      throw new Error('Failed to update SEO metadata');
    }
  }

  /**
   * Get all revisions for a content block
   * @param contentBlockId - ID of the content block
   * @returns Array of revisions
   */
  async getContentRevisions(contentBlockId: string): Promise<ContentRevision[]> {
    try {
      return await this.revisionRepository.find({
        where: { contentBlockId },
        order: { version: 'DESC' }
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content revisions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentBlockId
      });
      throw new Error('Failed to get content revisions');
    }
  }

  /**
   * Get a specific revision of a content block
   * @param contentBlockId - ID of the content block
   * @param version - Version number
   * @returns The revision
   */
  async getContentRevision(contentBlockId: string, version: number): Promise<ContentRevision | null> {
    try {
      return await this.revisionRepository.findOne({
        where: { contentBlockId, version }
      });
    } catch (error) {
      this.contextLogger.error('Failed to get content revision', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentBlockId,
        version
      });
      throw new Error('Failed to get content revision');
    }
  }

  /**
   * Restore a content block to a previous revision
   * @param contentBlockId - ID of the content block
   * @param version - Version to restore
   * @param userId - ID of the user restoring the revision
   * @returns The restored content block
   */
  async restoreRevision(contentBlockId: string, version: number, userId?: string): Promise<ContentBlock> {
    try {
      // Get the content block
      const contentBlock = await this.contentRepository.findOne({
        where: { id: contentBlockId }
      });

      if (!contentBlock) {
        throw new Error(`Content block with ID ${contentBlockId} not found`);
      }

      // Get the revision to restore
      const revision = await this.revisionRepository.findOne({
        where: { contentBlockId, version }
      });

      if (!revision) {
        throw new Error(`Revision ${version} not found for content block with ID ${contentBlockId}`);
      }

      // Create a new revision of the current state before restoring
      const latestRevision = await this.revisionRepository.findOne({
        where: { contentBlockId },
        order: { version: 'DESC' }
      });

      const nextVersion = latestRevision ? latestRevision.version + 1 : 1;
      
      await this.createRevision(
        contentBlock, 
        nextVersion, 
        `State before restoring to version ${version}`, 
        userId
      );

      // Restore the content block from the revision
      contentBlock.title = revision.title;
      contentBlock.slug = revision.slug;
      contentBlock.type = revision.type;
      contentBlock.content = revision.content;
      contentBlock.isPublished = revision.isPublished;
      contentBlock.metaTitle = revision.metaTitle;
      contentBlock.metaDescription = revision.metaDescription;
      contentBlock.metadata = revision.metadata;
      contentBlock.updatedBy = userId;

      const restoredContentBlock = await this.contentRepository.save(contentBlock);
      
      // Create a new revision for the restored version
      await this.createRevision(
        restoredContentBlock, 
        nextVersion + 1, 
        `Restored from version ${version}`, 
        userId
      );
      
      this.contextLogger.info('Content block restored to previous version', { 
        id: restoredContentBlock.id, 
        title: restoredContentBlock.title,
        restoredVersion: version,
        userId 
      });

      return restoredContentBlock;
    } catch (error) {
      this.contextLogger.error('Failed to restore revision', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentBlockId,
        version,
        userId
      });
      throw new Error('Failed to restore revision');
    }
  }

  /**
   * Create a new revision for a content block
   * @param contentBlock - The content block
   * @param version - Version number
   * @param changeDescription - Description of the changes
   * @param userId - ID of the user creating the revision
   * @returns The created revision
   */
  private async createRevision(
    contentBlock: ContentBlock, 
    version: number, 
    changeDescription: string, 
    userId?: string
  ): Promise<ContentRevision> {
    try {
      const revisionData: CreateContentRevisionInput = {
        contentBlockId: contentBlock.id,
        version,
        title: contentBlock.title,
        slug: contentBlock.slug,
        type: contentBlock.type,
        content: contentBlock.content,
        isPublished: contentBlock.isPublished,
        metaTitle: contentBlock.metaTitle,
        metaDescription: contentBlock.metaDescription,
        metadata: contentBlock.metadata,
        changeDescription,
        createdBy: userId,
      };

      const revision = this.revisionRepository.create(revisionData);
      
      return await this.revisionRepository.save(revision);
    } catch (error) {
      this.contextLogger.error('Failed to create revision', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentBlockId: contentBlock.id,
        version
      });
      throw new Error('Failed to create revision');
    }
  }
} 