import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type MovementType = 'INITIAL' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN';

@Entity('inventory_movement')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  inventoryId: string;

  @Column({
    type: 'enum',
    enum: ['INITIAL', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN'],
  })
  type: MovementType;

  @Column('integer')
  quantity: number;

  @Column('integer')
  previousStock: number;

  @Column('integer')
  newStock: number;

  @Column({ length: 255 })
  reference: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
} 