import { Repository, FindOptionsWhere, Between, FindOptionsOrder, IsNull, Not, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
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
  private contextLogger = logger.child({ service: 'ContentService' });

  constructor() {
    this.contentRepository = AppDataSource.getRepository(ContentBlock);
    this.revisionRepository = AppDataSource.getRepository(ContentRevision);
    this.slugService = new SlugService();
  }

  /**
   * Create a new content block
   */
  async createContentBlock(input: CreateContentBlockInput, userId?: string): Promise<ContentBlock> {
    try {
      // Generate a unique slug if not provided
      if (!input.slug) {
        input.slug = await this.slugService.generateUniqueSlug(input.title, input.type);
      } else {
        const normalizedSlug = this.slugService.normalizeSlug(input.slug);
        if (!(await this.slugService.isSlugUnique(normalizedSlug, input.type))) {
          input.slug = await this.slugService.generateUniqueSlug(normalizedSlug, input.type);
        } else {
          input.slug = normalizedSlug;
        }
      }

      const contentBlock = this.contentRepository.create({
        ...input,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedContentBlock = await this.contentRepository.save(contentBlock);
      
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
   * Get a content block by ID
   */
  async getContentBlockById(id: string): Promise<ContentBlock | null> {
    try {
      return await this.contentRepository.findOne({
        where: { id },
        relations: ['history', 'translations']
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
   * Get a content block by slug
   */
  async getContentBlockBySlug(slug: string, locale?: string): Promise<ContentBlock | null> {
    try {
      const where: FindOptionsWhere<ContentBlock> = { slug };
      if (locale) {
        where.locale = locale;
      }

      return await this.contentRepository.findOne({
        where,
        relations: ['history', 'translations']
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
   * Get published content blocks
   */
  async getPublishedContentBlocks(
    options: ContentPaginationOptions,
    filters: ContentFilterOptions = {}
  ): Promise<[ContentBlock[], number]> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
      const skip = (page - 1) * limit;

      const queryBuilder = this.contentRepository.createQueryBuilder('content')
        .where('content.isPublished = :isPublished', { isPublished: true });

      // Apply filters
      if (filters.type) {
        queryBuilder.andWhere('content.type = :type', { type: filters.type });
      }

      if (filters.locale) {
        queryBuilder.andWhere('content.locale = :locale', { locale: filters.locale });
      }

      if (filters.searchTerm) {
        queryBuilder.andWhere(
          '(content.title ILIKE :searchTerm OR content.content::text ILIKE :searchTerm)',
          { searchTerm: `%${filters.searchTerm}%` }
        );
      }

      const [contentBlocks, total] = await queryBuilder
        .orderBy(`content.${sortBy}`, sortOrder)
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return [contentBlocks, total];
    } catch (error) {
      this.contextLogger.error('Failed to get published content blocks', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
        filters
      });
      throw new Error('Failed to get published content blocks');
    }
  }

  /**
   * Get content blocks with pagination and filtering
   */
  async getContentBlocks(
    options: ContentPaginationOptions,
    filters: ContentFilterOptions = {}
  ): Promise<[ContentBlock[], number]> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
      const skip = (page - 1) * limit;

      const queryBuilder = this.contentRepository.createQueryBuilder('content');

      // Apply filters
      if (filters.type) {
        queryBuilder.andWhere('content.type = :type', { type: filters.type });
      }

      if (filters.isPublished !== undefined) {
        queryBuilder.andWhere('content.isPublished = :isPublished', { isPublished: filters.isPublished });
      }

      if (filters.locale) {
        queryBuilder.andWhere('content.locale = :locale', { locale: filters.locale });
      }

      if (filters.searchTerm) {
        queryBuilder.andWhere(
          '(content.title ILIKE :searchTerm OR content.content::text ILIKE :searchTerm)',
          { searchTerm: `%${filters.searchTerm}%` }
        );
      }

      const [contentBlocks, total] = await queryBuilder
        .orderBy(`content.${sortBy}`, sortOrder)
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return [contentBlocks, total];
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
   * Get a content block by slug and type
   */
  async getContentBlockBySlugAndType(
    slug: string, 
    type: ContentBlockType,
    locale?: string
  ): Promise<ContentBlock | null> {
    try {
      const where: FindOptionsWhere<ContentBlock> = { slug, type };
      
      if (locale) {
        where.locale = locale;
      }

      return await this.contentRepository.findOne({
        where,
        relations: ['history', 'translations']
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
   * Update an existing content block
   */
  async updateContentBlock(
    id: string, 
    input: UpdateContentBlockInput, 
    userId?: string,
    changeDescription?: string
  ): Promise<ContentBlock> {
    try {
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

      return await this.contentRepository.save(contentBlock);
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
   * Update publication status
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

      contentBlock.isPublished = isPublished;
      contentBlock.updatedBy = userId;

      if (isPublished && !contentBlock.publishAt) {
        contentBlock.publishAt = new Date();
      }

      return await this.contentRepository.save(contentBlock);
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
   * Delete a content block
   */
  async deleteContentBlock(id: string): Promise<boolean> {
    try {
      const contentBlock = await this.contentRepository.findOne({
        where: { id }
      });

      if (!contentBlock) {
        return false;
      }

      await this.contentRepository.remove(contentBlock);
      return true;
    } catch (error) {
      this.contextLogger.error('Failed to delete content block', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw new Error('Failed to delete content block');
    }
  }

  /**
   * Create a new revision for a content block
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
        createdBy: userId
      };

      const revision = this.revisionRepository.create(revisionData);
      return await this.revisionRepository.save(revision);
    } catch (error) {
      this.contextLogger.error('Failed to create revision', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentBlockId: contentBlock.id,
        version,
        changeDescription,
        userId
      });
      throw new Error('Failed to create revision');
    }
  }
} 