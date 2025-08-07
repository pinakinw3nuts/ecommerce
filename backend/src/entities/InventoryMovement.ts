import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inventory } from './Inventory';

export enum MovementType {
  INITIAL = 'INITIAL',
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
}

@Entity('inventory_movement')
@Index(['inventoryId'])
@Index(['type'])
@Index(['createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  inventoryId!: string;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type!: MovementType;

  @Column('integer')
  quantity!: number;

  @Column('integer')
  previousStock!: number;

  @Column('integer')
  newStock!: number;

  @Column({ length: 255 })
  reference!: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Inventory, inventory => inventory.movements)
  @JoinColumn({ name: 'inventoryId' })
  inventory!: Inventory;

  /**
   * Convert to JSON for response
   */
  toJSON() {
    return {
      id: this.id,
      inventoryId: this.inventoryId,
      type: this.type,
      quantity: this.quantity,
      previousStock: this.previousStock,
      newStock: this.newStock,
      reference: this.reference,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
    };
  }
} 