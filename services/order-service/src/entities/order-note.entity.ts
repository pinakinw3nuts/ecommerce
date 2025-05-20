import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_notes')
export class OrderNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  content: string;

  @Column()
  userId: string;

  @Column({ default: false })
  isInternal: boolean;

  @Column({ nullable: true })
  adminId?: string;

  @ManyToOne(() => Order, order => order.notes)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 