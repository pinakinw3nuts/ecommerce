import { AppDataSource } from '../config/dataSource';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { ProductVariant } from '../entities/ProductVariant';
import { generateSlug } from '../utils/slugify';
import { In } from 'typeorm';

export class ProductService {
  private productRepo = AppDataSource.getRepository(Product);
  private categoryRepo = AppDataSource.getRepository(Category);
  private tagRepo = AppDataSource.getRepository(Tag);
  private variantRepo = AppDataSource.getRepository(ProductVariant);

  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    mediaUrl?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    categoryId: string;
    tagIds?: string[];
    variants?: Array<{
      name: string;
      sku: string;
      price: number;
      stock: number;
    }>;
  }) {
    const slug = generateSlug(data.name);
    const category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
    let tags: Tag[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }
    const product = this.productRepo.create({
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      mediaUrl: data.mediaUrl,
      isFeatured: data.isFeatured ?? false,
      isPublished: data.isPublished ?? true,
      category,
      tags,
    });
    if (data.variants && data.variants.length > 0) {
      product.variants = data.variants.map(v => this.variantRepo.create(v));
    }
    return this.productRepo.save(product);
  }

  async getProductById(id: string) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category', 'tags', 'variants'],
    });
  }

  async updateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    mediaUrl?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    categoryId: string;
    tagIds: string[];
    variants: Array<{
      id?: string;
      name: string;
      sku: string;
      price: number;
      stock: number;
    }>;
  }>) {
    const product = await this.productRepo.findOneOrFail({ where: { id }, relations: ['variants', 'tags', 'category'] });
    if (data.name) {
      product.name = data.name;
      product.slug = generateSlug(data.name);
    }
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.mediaUrl !== undefined) product.mediaUrl = data.mediaUrl;
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
    if (data.isPublished !== undefined) product.isPublished = data.isPublished;
    if (data.categoryId) {
      product.category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
    }
    if (data.tagIds) {
      product.tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }
    if (data.variants) {
      // Remove old variants and add new ones
      await this.variantRepo.delete({ product: { id: product.id } });
      product.variants = data.variants.map(v => this.variantRepo.create(v));
    }
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string) {
    return this.productRepo.delete(id);
  }

  async listProducts(options?: { skip?: number; take?: number }) {
    return this.productRepo.find({
      relations: ['category', 'tags', 'variants'],
      skip: options?.skip,
      take: options?.take,
      order: { createdAt: 'DESC' },
    });
  }
} 