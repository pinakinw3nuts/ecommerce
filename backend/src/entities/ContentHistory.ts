import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContentBlock } from './ContentBlock';

/**
 * ContentHistory entity for tracking changes to content blocks
 */
@Entity('content_history')
export class ContentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  contentBlockId!: string;

  @ManyToOne(() => ContentBlock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentBlockId' })
  contentBlock!: ContentBlock;

  @Column({ type: 'jsonb' })
  previousData!: Record<string, any>;

  @Column({ type: 'jsonb' })
  newData!: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeDescription!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  changedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
} 