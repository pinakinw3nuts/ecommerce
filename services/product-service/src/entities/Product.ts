import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { ProductVariant } from './ProductVariant';
import { Tag } from './Tag';
import { Category } from './Category';
import { ProductImage } from './ProductImage';
import { Brand } from './Brand';
import { Offer } from './Offer';
import { Coupon } from './Coupon';
import { ProductReview } from './ProductReview';
import { AttributeValue } from './AttributeValue';
import { ProductBundle } from './ProductBundle';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'timestamp', nullable: true })
  saleStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  saleEndDate: Date;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ default: true })
  isInStock: boolean;

  @Column({ type: 'text', nullable: true })
  specifications: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  seoMetadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };

  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @ManyToOne(() => Brand, brand => brand.products)
  brand: Brand;

  @OneToMany(() => ProductVariant, variant => variant.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductReview, review => review.product, { cascade: true })
  reviews: ProductReview[];

  @ManyToMany(() => Tag, tag => tag.products)
  @JoinTable()
  tags: Tag[];

  @ManyToMany(() => Offer, offer => offer.products)
  offers: Offer[];

  @ManyToMany(() => Coupon, coupon => coupon.products)
  coupons: Coupon[];

  @ManyToMany(() => AttributeValue, attributeValue => attributeValue.products)
  @JoinTable({
    name: 'product_attribute_values',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'attribute_value_id', referencedColumnName: 'id' }
  })
  attributes: AttributeValue[];

  @ManyToMany(() => Product, product => product.relatedProducts)
  @JoinTable({
    name: 'related_products',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'related_product_id', referencedColumnName: 'id' }
  })
  relatedProducts: Product[];

  @ManyToMany(() => ProductBundle, bundle => bundle.products)
  bundles: ProductBundle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 