import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany
} from 'typeorm';
import { ContentHistory } from './ContentHistory';
import { ContentTranslation } from './ContentTranslation';

/**
 * Content block types enum
 */
export enum ContentBlockType {
  PAGE = 'page',
  SECTION = 'section',
  BANNER = 'banner',
  BLOG_POST = 'blog_post',
  PRODUCT = 'product',
  CATEGORY = 'category',
  FAQ = 'faq'
}

/**
 * ContentBlock entity for storing CMS content blocks
 * This includes static pages, landing pages, banners, and other content types
 */
@Entity('content_block')
export class ContentBlock {
  /**
   * Unique identifier for the content block
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Title of the content block
   */
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  /**
   * Slug for the content block (unique, URL-friendly identifier)
   */
  @Column({ type: 'varchar', length: 200, unique: true })
  @Index()
  slug!: string;

  /**
   * Type of content block (static, page, banner)
   */
  @Column({
    type: 'enum',
    enum: ContentBlockType,
    default: ContentBlockType.PAGE
  })
  @Index()
  type!: ContentBlockType;

  /**
   * JSON content data for the block
   * Stores the structured content of the block (e.g., rich text, components, layout)
   */
  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, any>;

  /**
   * Publication status
   */
  @Column({ type: 'boolean', default: false })
  @Index()
  isPublished!: boolean;

  /**
   * Scheduled publication date
   */
  @Column({ type: 'timestamp', nullable: true })
  publishAt?: Date;

  /**
   * Scheduled expiration date
   */
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  /**
   * SEO metadata - title
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  metaTitle?: string;

  /**
   * SEO metadata - description
   */
  @Column({ type: 'varchar', length: 250, nullable: true })
  metaDescription?: string;

  /**
   * SEO metadata - keywords
   */
  @Column({ type: 'varchar', length: 250, nullable: true })
  metaKeywords?: string;

  /**
   * Open Graph image URL
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  ogImage?: string;

  /**
   * Additional metadata as JSON
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  /**
   * Sort order for listing the content blocks
   */
  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  /**
   * User ID of the creator
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy?: string;

  /**
   * User ID of the last editor
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  updatedBy?: string;

  /**
   * Creation timestamp
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Last update timestamp
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Parent content block ID (for hierarchical content)
   */
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  /**
   * Locale code for internationalization
   */
  @Column({ type: 'varchar', length: 10, default: 'en' })
  @Index()
  locale!: string;

  /**
   * Reference to master content block ID (for translations)
   */
  @Column({ type: 'uuid', nullable: true })
  masterContentBlockId?: string;

  @OneToMany(() => ContentHistory, history => history.contentBlock)
  history!: ContentHistory[];

  @OneToMany(() => ContentTranslation, translation => translation.masterContentBlock)
  translations!: ContentTranslation[];
}

/**
 * Interface for creating a content block
 */
export interface CreateContentBlockInput {
  title: string;
  slug: string;
  type: ContentBlockType;
  content: Record<string, any>;
  isPublished?: boolean;
  publishAt?: Date;
  expiresAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
  createdBy?: string;
  parentId?: string;
  locale?: string;
  masterContentBlockId?: string;
}

/**
 * Interface for updating a content block
 */
export interface UpdateContentBlockInput {
  title?: string;
  slug?: string;
  type?: ContentBlockType;
  content?: Record<string, any>;
  isPublished?: boolean;
  publishAt?: Date | null;
  expiresAt?: Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  metadata?: Record<string, any>;
  sortOrder?: number;
  updatedBy?: string;
  parentId?: string | null;
  locale?: string;
  masterContentBlockId?: string | null;
} 