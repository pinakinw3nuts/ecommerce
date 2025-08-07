import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';
import { ContentBlockType } from './ContentBlock';

/**
 * ContentRevision entity for storing previous versions of content blocks
 */
@Entity('content_revisions')
export class ContentRevision {
  /**
   * Unique identifier for the revision
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Reference to the content block this revision belongs to
   */
  @Column({ type: 'uuid' })
  @Index()
  contentBlockId!: string;

  /**
   * Version number (auto-incremented per content block)
   */
  @Column({ type: 'int' })
  version!: number;

  /**
   * Title of the content block at this revision
   */
  @Column({ length: 200 })
  title!: string;

  /**
   * Slug at this revision
   */
  @Column({ length: 200 })
  slug!: string;

  /**
   * Type of content block at this revision
   */
  @Column({
    type: 'enum',
    enum: ContentBlockType,
  })
  type!: ContentBlockType;

  /**
   * Content data at this revision
   */
  @Column({ type: 'jsonb' })
  content!: Record<string, any>;

  /**
   * Publication status at this revision
   */
  @Column()
  isPublished!: boolean;

  /**
   * SEO metadata - title at this revision
   */
  @Column({ length: 100, nullable: true })
  metaTitle?: string;

  /**
   * SEO metadata - description at this revision
   */
  @Column({ length: 250, nullable: true })
  metaDescription?: string;

  /**
   * Additional metadata at this revision
   */
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  /**
   * Change description
   */
  @Column({ type: 'text', nullable: true })
  changeDescription?: string;

  /**
   * User ID who created this revision
   */
  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  /**
   * Creation timestamp
   */
  @CreateDateColumn()
  createdAt!: Date;
}

/**
 * Interface for creating a content revision
 */
export interface CreateContentRevisionInput {
  contentBlockId: string;
  version: number;
  title: string;
  slug: string;
  type: ContentBlockType;
  content: Record<string, any>;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metadata?: Record<string, any>;
  changeDescription?: string;
  createdBy?: string;
} 