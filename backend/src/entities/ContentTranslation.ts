import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContentBlock } from './ContentBlock';

/**
 * ContentTranslation entity for storing translations of content blocks
 */
@Entity('content_translation')
export class ContentTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  masterContentBlockId!: string;

  @ManyToOne(() => ContentBlock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'masterContentBlockId' })
  masterContentBlock!: ContentBlock;

  @Column({ type: 'varchar', length: 10 })
  locale!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  metaTitle!: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  metaDescription!: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  metaKeywords!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ogImage!: string;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  publishedBy!: string;

  @Column({ type: 'timestamp', nullable: true })
  publishAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updatedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 