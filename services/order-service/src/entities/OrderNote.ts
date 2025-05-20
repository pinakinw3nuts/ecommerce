import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';

@Entity()
export class OrderNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  orderId!: string;

  @Column()
  content!: string;

  @Column({ default: false })
  isPrivate: boolean = false;

  @Column({ nullable: true })
  adminId?: string;

  @Column({ default: false })
  isInternal: boolean = false;

  @Column()
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => Order, order => order.notes)
  @JoinColumn({ name: 'orderId' })
  order!: Order;
} 