import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CartItem } from './CartItem';

export interface CartMetadata {
  deviceId?: string;
  [key: string]: unknown;
}

export interface SerializedCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  total?: number;
  productSnapshot: {
    name: string;
    description?: string;
    imageUrl?: string;
    additionalImages?: string[];
    variantName?: string;
    sku?: string;
    brand?: {
      id?: string;
      name?: string;
      logoUrl?: string;
    };
    category?: {
      id?: string;
      name?: string;
    };
    attributes?: {
      [key: string]: string | number | boolean;
    };
    dimensions?: {
      width?: number;
      height?: number;
      depth?: number;
      weight?: number;
      unit?: string;
    };
    originalPrice?: number;
    salePrice?: number;
    slug?: string;
    metadata?: Record<string, unknown>;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CartJSON {
  id: string;
  userId: string | null;
  total: number;
  itemCount: number;
  items: SerializedCartItem[];
  isCheckedOut: boolean;
  metadata: CartMetadata | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { nullable: true })
  @Index()
  userId!: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column('integer', { default: 0 })
  itemCount!: number;

  @Column('boolean', { default: false })
  isCheckedOut!: boolean;

  @Column('jsonb', { nullable: true })
  metadata!: CartMetadata | null;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items!: CartItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('timestamp', { nullable: true })
  expiresAt!: Date | null;

  /**
   * Calculate cart totals
   */
  calculateTotals(): void {
    // Ensure items is initialized
    if (!this.items) {
      this.items = [];
    }
    
    // Calculate total price
    this.total = this.items.reduce(
      (sum, item) => {
        // Ensure price is a valid number
        const price = typeof item.price === 'string' ? Number(item.price) : 
                     typeof item.price === 'number' ? item.price : 0;
        
        return sum + item.quantity * price;
      },
      0
    );
    
    // Calculate total item count
    this.itemCount = this.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  /**
   * Check if cart is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if cart belongs to user
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Convert to JSON for response
   */
  toJSON(): CartJSON {
    // Calculate totals before converting to JSON
    this.calculateTotals();
    
    // Ensure items is initialized
    const items = Array.isArray(this.items) ? this.items : [];
    
    // Map item array, handling potential errors
    const serializedItems = items.map(item => {
      try {
        if (typeof item.toJSON === 'function') {
          return item.toJSON();
        }
        
        // Fallback if toJSON isn't available
        const price = typeof item.price === 'string' ? Number(item.price) : 
                      typeof item.price === 'number' ? item.price : 0;
                      
        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: price,
          total: price * item.quantity,
          productSnapshot: {
            ...(item.productSnapshot || { name: 'Unknown Product' }),
            sku: item.productSnapshot?.sku
          }
        };
      } catch (error) {
        // Last resort fallback if something is wrong with the item
        return {
          id: item.id || 'unknown',
          productId: item.productId || 'unknown',
          quantity: Number(item.quantity) || 0,
          price: 0,
          total: 0,
          productSnapshot: {
            name: 'Error Processing Item',
            sku: undefined
          }
        };
      }
    });
    
    return {
      id: this.id,
      userId: this.userId,
      total: Number(this.total || 0),
      itemCount: Number(this.itemCount || 0),
      items: serializedItems,
      isCheckedOut: Boolean(this.isCheckedOut),
      metadata: this.metadata,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : String(this.updatedAt),
      expiresAt: this.expiresAt instanceof Date ? this.expiresAt.toISOString() : this.expiresAt,
    };
  }
} 