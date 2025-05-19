import { DataSource } from 'typeorm';
import { env } from './env';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { ProductVariant } from '../entities/ProductVariant';
import { ProductImage } from '../entities/ProductImage';
import { Brand } from '../entities/Brand';
import { Offer } from '../entities/Offer';
import { Coupon } from '../entities/Coupon';
import { ProductReview } from '../entities/ProductReview';
import { ProductAttribute } from '../entities/ProductAttribute';
import { AttributeValue } from '../entities/AttributeValue';
import { ProductBundle } from '../entities/ProductBundle';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: true,
  logging: env.NODE_ENV === 'development',
  entities: [
    Product,
    Category,
    Tag,
    ProductVariant,
    ProductImage,
    Brand,
    Offer,
    Coupon,
    ProductReview,
    ProductAttribute,
    AttributeValue,
    ProductBundle
  ],
  migrations: [],
  subscribers: [],
}); 