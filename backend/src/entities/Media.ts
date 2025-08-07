import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Media type enum
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * Media entity for storing uploaded files metadata
 */
@Entity('media')
export class Media {
  /**
   * Unique identifier for the media item
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Original filename
   */
  @Column({ length: 255 })
  filename!: string;

  /**
   * Media type (image, video, document, etc.)
   */
  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.OTHER,
  })
  @Index()
  type!: MediaType;

  /**
   * MIME type of the file
   */
  @Column({ length: 100 })
  mimeType!: string;

  /**
   * File size in bytes
   */
  @Column({ type: 'bigint' })
  fileSize!: number;

  /**
   * Storage location (local, s3, etc.)
   */
  @Column({ length: 50, default: 'local' })
  storage!: string;

  /**
   * Public URL for accessing the file
   */
  @Column()
  url!: string;

  /**
   * Alternative text for accessibility (mainly for images)
   */
  @Column({ nullable: true })
  alt?: string;

  /**
   * Caption for the media
   */
  @Column({ type: 'text', nullable: true })
  caption?: string;

  /**
   * Width in pixels (for images and videos)
   */
  @Column({ type: 'int', nullable: true })
  width?: number;

  /**
   * Height in pixels (for images and videos)
   */
  @Column({ type: 'int', nullable: true })
  height?: number;

  /**
   * Duration in seconds (for audio and video)
   */
  @Column({ type: 'float', nullable: true })
  duration?: number;

  /**
   * Additional metadata as JSON
   */
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  /**
   * User ID of the uploader
   */
  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string;

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
}

/**
 * Interface for creating a media item
 */
export interface CreateMediaInput {
  filename: string;
  type: MediaType;
  mimeType: string;
  fileSize: number;
  storage: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, any>;
  uploadedBy?: string;
}

/**
 * Interface for updating a media item
 */
export interface UpdateMediaInput {
  filename?: string;
  type?: MediaType;
  alt?: string;
  caption?: string;
  metadata?: Record<string, any>;
} 