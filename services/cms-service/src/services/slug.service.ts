import { Repository } from 'typeorm';
import { AppDataSource } from '../database';
import { ContentBlock, ContentBlockType } from '../entities/ContentBlock';
import { slugify, makeSlugUnique } from '../utils/slugify';
import { logger } from '../utils/logger';

/**
 * Options for slug generation
 */
export interface SlugOptions {
  maxLength?: number;
  lowercase?: boolean;
  preserveNumbers?: boolean;
  preserveCharacters?: string;
}

/**
 * Service for generating and validating unique slugs
 */
export class SlugService {
  private contentRepository: Repository<ContentBlock>;
  private contextLogger = logger.child({ context: 'SlugService' });

  constructor() {
    this.contentRepository = AppDataSource.getRepository(ContentBlock);
  }

  /**
   * Generate a unique slug for a content block
   * 
   * @param title - The title to generate a slug from
   * @param contentType - The type of content (to ensure uniqueness per type)
   * @param options - Slug generation options
   * @param excludeId - Optional ID to exclude from uniqueness check (for updates)
   * @returns A unique slug for the content
   */
  async generateUniqueSlug(
    title: string,
    contentType: ContentBlockType,
    options: SlugOptions = {},
    excludeId?: string
  ): Promise<string> {
    try {
      // Generate base slug from title
      const baseSlug = slugify(title, options);
      
      // Get existing slugs for this content type
      const existingSlugs = await this.getSlugsForContentType(contentType, excludeId);
      
      // Make the slug unique
      const uniqueSlug = makeSlugUnique(baseSlug, existingSlugs);
      
      this.contextLogger.debug('Generated unique slug', { 
        title, 
        contentType, 
        baseSlug, 
        uniqueSlug 
      });
      
      return uniqueSlug;
    } catch (error) {
      this.contextLogger.error('Failed to generate unique slug', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        title,
        contentType
      });
      throw new Error('Failed to generate unique slug');
    }
  }

  /**
   * Check if a slug is unique for a specific content type
   * 
   * @param slug - The slug to check
   * @param contentType - The type of content
   * @param excludeId - Optional ID to exclude from the check (for updates)
   * @returns True if the slug is unique, false otherwise
   */
  async isSlugUnique(
    slug: string,
    contentType: ContentBlockType,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const existingSlugs = await this.getSlugsForContentType(contentType, excludeId);
      return !existingSlugs.includes(slug);
    } catch (error) {
      this.contextLogger.error('Failed to check slug uniqueness', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        contentType
      });
      throw new Error('Failed to check slug uniqueness');
    }
  }

  /**
   * Suggest a unique slug for a given title and content type
   * 
   * @param title - The title to generate a slug from
   * @param contentType - The type of content
   * @param options - Slug generation options
   * @returns A suggested unique slug
   */
  async suggestSlug(
    title: string,
    contentType: ContentBlockType,
    options: SlugOptions = {}
  ): Promise<string> {
    return this.generateUniqueSlug(title, contentType, options);
  }

  /**
   * Get all slugs for a specific content type
   * 
   * @param contentType - The type of content
   * @param excludeId - Optional ID to exclude from the results
   * @returns Array of existing slugs for the content type
   */
  private async getSlugsForContentType(
    contentType: ContentBlockType,
    excludeId?: string
  ): Promise<string[]> {
    try {
      // Build query to get all content blocks of the specified type
      const query = this.contentRepository
        .createQueryBuilder('content')
        .select('content.slug')
        .where('content.type = :contentType', { contentType });
      
      // Exclude a specific ID if provided
      if (excludeId) {
        query.andWhere('content.id != :excludeId', { excludeId });
      }
      
      const results = await query.getRawMany();
      
      // Extract slugs from results
      return results.map(result => result.content_slug);
    } catch (error) {
      this.contextLogger.error('Failed to get slugs for content type', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        contentType
      });
      throw new Error('Failed to get slugs for content type');
    }
  }

  /**
   * Normalize a slug to ensure it follows the proper format
   * 
   * @param slug - The slug to normalize
   * @param options - Slug generation options
   * @returns A normalized slug
   */
  normalizeSlug(slug: string, options: SlugOptions = {}): string {
    return slugify(slug, options);
  }

  /**
   * Generate a URL path for a content block based on its type and slug
   * 
   * @param contentType - The type of content
   * @param slug - The slug of the content
   * @returns A URL path for the content
   */
  generateUrlPath(contentType: ContentBlockType, slug: string): string {
    // Generate different URL patterns based on content type
    switch (contentType) {
      case ContentBlockType.PAGE:
        return `/pages/${slug}`;
      case ContentBlockType.BANNER:
        return `/banners/${slug}`;
      default:
        return `/${slug}`;
    }
  }

  /**
   * Parse a URL path to extract content type and slug
   * 
   * @param path - The URL path to parse
   * @returns The content type and slug, or null if not recognized
   */
  parseUrlPath(path: string): { contentType: ContentBlockType; slug: string } | null {
    // Remove leading slash and split by slashes
    const segments = path.replace(/^\//, '').split('/');
    
    if (segments.length === 1) {
      // Root level path like /about
      if (!segments[0]) {
        return null; // Handle empty path
      }
      return {
        contentType: ContentBlockType.PAGE, // Use PAGE instead of STATIC
        slug: segments[0]
      };
    } else if (segments.length === 2) {
      // Path with type prefix like /pages/about
      const [typePrefix, slug] = segments;
      
      if (!slug) {
        return null; // Handle missing slug
      }
      
      if (typePrefix === 'pages') {
        return {
          contentType: ContentBlockType.PAGE,
          slug
        };
      } else if (typePrefix === 'banners') {
        return {
          contentType: ContentBlockType.BANNER,
          slug
        };
      }
    }
    
    return null;
  }
} 