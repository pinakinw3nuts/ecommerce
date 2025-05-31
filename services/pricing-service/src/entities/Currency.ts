import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity()
export class Currency {
  @PrimaryColumn()
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  symbol!: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 1 })
  exchangeRate!: number;

  @Column({ default: false })
  @Index()
  isDefault!: boolean;

  @Column({ default: true })
  @Index()
  isActive!: boolean;

  @Column({ type: 'int', default: 2 })
  decimalPlaces!: number;

  @Column({ nullable: true })
  format!: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  rateLastUpdated!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Format an amount in this currency
   */
  formatAmount(amount: number): string {
    if (this.format) {
      // Replace placeholder with the formatted amount
      return this.format.replace('{{amount}}', amount.toFixed(this.decimalPlaces));
    }

    // Default formatting with currency symbol
    return `${this.symbol || this.code} ${amount.toFixed(this.decimalPlaces)}`;
  }
} 