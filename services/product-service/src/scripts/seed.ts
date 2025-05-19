import { AppDataSource } from '../config/dataSource';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { generateSlug } from '../utils/slugify';

async function seed() {
  await AppDataSource.initialize();

  // Create categories
  const electronics = AppDataSource.getRepository(Category).create({
    name: 'Electronics',
    slug: generateSlug('Electronics'),
    description: 'Electronic gadgets and devices',
  });
  const apparel = AppDataSource.getRepository(Category).create({
    name: 'Apparel',
    slug: generateSlug('Apparel'),
    description: 'Clothing and accessories',
  });
  await AppDataSource.getRepository(Category).save([electronics, apparel]);

  // Create tags
  const tagNew = AppDataSource.getRepository(Tag).create({ name: 'New', slug: generateSlug('New') });
  const tagSale = AppDataSource.getRepository(Tag).create({ name: 'Sale', slug: generateSlug('Sale') });
  await AppDataSource.getRepository(Tag).save([tagNew, tagSale]);

  // Create a featured product with variants and tags
  const product = AppDataSource.getRepository(Product).create({
    name: 'Smartphone X',
    slug: generateSlug('Smartphone X'),
    description: 'A flagship smartphone with amazing features.',
    price: 999.99,
    mediaUrl: '',
    isFeatured: true,
    isPublished: true,
    category: electronics,
    tags: [tagNew, tagSale],
    variants: [
      AppDataSource.getRepository(ProductVariant).create({
        name: '128GB Black',
        sku: 'SMX-128-BLK',
        price: 999.99,
        stock: 50,
      }),
      AppDataSource.getRepository(ProductVariant).create({
        name: '256GB Silver',
        sku: 'SMX-256-SLV',
        price: 1099.99,
        stock: 30,
      }),
    ],
  });
  await AppDataSource.getRepository(Product).save(product);

  console.log('Seed data inserted successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
}); 