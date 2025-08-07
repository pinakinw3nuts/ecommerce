import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { ProductVariant } from '../entities/ProductVariant';
import { Brand } from '../entities/Brand';
import { slugify } from '../utils/slugify';
import { In, Like, Between, FindOptionsOrder, FindOptionsWhere, ILike } from 'typeorm';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { logger } from '../utils/logger';

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  categoryIds?: string;
  minPrice?: number;
  maxPrice?: number;
  tagIds?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  hasSalePrice?: boolean;
  excludeProductId?: string;
}

export interface ProductSortOptions {
  sortBy?: 'name' | 'price' | 'createdAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductPaginationOptions {
  page?: number;
  limit?: number;
}

export class ProductService {
  private productRepo = AppDataSource.getRepository(Product);
  private categoryRepo = AppDataSource.getRepository(Category);
  private tagRepo = AppDataSource.getRepository(Tag);
  private variantRepo = AppDataSource.getRepository(ProductVariant);
  private brandRepo = AppDataSource.getRepository(Brand);

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
    salePrice?: number;
    saleStartDate?: Date;
    saleEndDate?: Date;
    stockQuantity?: number;
    isInStock?: boolean;
    specifications?: string;
    keywords?: string[];
    seoMetadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
      ogImage?: string;
    };
    brandId?: string;
  }): Promise<Product> {
    logger.info('Creating product with data:', { name: data.name, categoryId: data.categoryId });
    
    const slug = slugify(data.name);
    const category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
    
    // Fetch tags if provided
    let tags: Tag[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      logger.info(`Fetching ${data.tagIds.length} tags with IDs:`, data.tagIds);
      tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
      logger.info(`Found ${tags.length} tags`);
    }

    // Fetch brand if provided
    let brand: Brand | undefined = undefined;
    if (data.brandId) {
      brand = await this.brandRepo.findOneBy({ id: data.brandId }) || undefined;
    }
    
    // Create the product with basic fields
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
      brand,
      // Add the additional fields
      salePrice: data.salePrice,
      saleStartDate: data.saleStartDate,
      saleEndDate: data.saleEndDate,
      stockQuantity: data.stockQuantity ?? 0,
      isInStock: data.isInStock ?? true,
      specifications: data.specifications,
      keywords: data.keywords,
      seoMetadata: data.seoMetadata,
    });

    // Save the product first
    const savedProduct = await this.productRepo.save(product) as Product;
    logger.info('Product saved with ID:', savedProduct.id);

    // Create variants if provided
    if (data.variants && data.variants.length > 0) {
      const variants = data.variants.map(variantData => 
        this.variantRepo.create({
          ...variantData,
          product: savedProduct
        })
      );
      await this.variantRepo.save(variants);
      logger.info(`Created ${variants.length} variants for product ${savedProduct.id}`);
    }

    return savedProduct;
  }

  async getProductById(id: string) {
    try {
      logger.info('Fetching product by ID:', { id });
      
      const product = await this.productRepo.findOne({
        where: { id },
        relations: [
          'category', 
          'brand', 
          'variants', 
          'images', 
          'reviews', 
          'tags', 
          'attributes',
          'bundles',
          'offers'
        ]
      });

      if (!product) {
        logger.warn('Product not found by ID:', { id });
        return null;
      }

      logger.info('Product found by ID:', { id, name: product.name });
      return product;
    } catch (error) {
      logger.error('Error fetching product by ID:', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async getProductBySlug(slug: string) {
    try {
      logger.info('Fetching product by slug:', { slug });
      
      const product = await this.productRepo.findOne({
        where: { slug },
        relations: [
          'category', 
          'brand', 
          'variants', 
          'images', 
          'reviews', 
          'tags', 
          'attributes',
          'bundles',
          'offers'
        ]
      });

      if (!product) {
        logger.warn('Product not found by slug:', { slug });
        return null;
      }

      logger.info('Product found by slug:', { slug, id: product.id, name: product.name });
      return product;
    } catch (error) {
      logger.error('Error fetching product by slug:', { slug, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
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
    salePrice?: number;
    saleStartDate?: Date;
    saleEndDate?: Date;
    stockQuantity?: number;
    isInStock?: boolean;
    specifications?: string;
    keywords?: string[];
    seoMetadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
      ogImage?: string;
    };
    brandId?: string;
  }>) {
    const product = await this.productRepo.findOneByOrFail({ id });
    
    // Update basic fields
    if (data.name) {
      product.name = data.name;
      product.slug = slugify(data.name);
    }
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.mediaUrl !== undefined) product.mediaUrl = data.mediaUrl;
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
    if (data.isPublished !== undefined) product.isPublished = data.isPublished;
    if (data.salePrice !== undefined) product.salePrice = data.salePrice;
    if (data.saleStartDate !== undefined) product.saleStartDate = data.saleStartDate;
    if (data.saleEndDate !== undefined) product.saleEndDate = data.saleEndDate;
    if (data.stockQuantity !== undefined) product.stockQuantity = data.stockQuantity;
    if (data.isInStock !== undefined) product.isInStock = data.isInStock;
    if (data.specifications !== undefined) product.specifications = data.specifications;
    if (data.keywords !== undefined) product.keywords = data.keywords;
    if (data.seoMetadata !== undefined) product.seoMetadata = data.seoMetadata;

    // Update category if provided
    if (data.categoryId) {
      const category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
      product.category = category;
    }

    // Update brand if provided
    if (data.brandId) {
      const brand = await this.brandRepo.findOneBy({ id: data.brandId });
      if (brand) {
        product.brand = brand;
      }
    }

    // Update tags if provided
    if (data.tagIds) {
      const tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
      product.tags = tags;
    }

    // Update variants if provided
    if (data.variants) {
      // Remove existing variants
      await this.variantRepo.delete({ product: { id } });
      
      // Create new variants
      const variants = data.variants.map(variantData => 
        this.variantRepo.create({
          ...variantData,
          product
        })
      );
      await this.variantRepo.save(variants);
    }

    return await this.productRepo.save(product);
  }

  async deleteProduct(id: string) {
    return await this.productRepo.delete({ id });
  }

  async listProducts(options?: {
    filters?: ProductFilterOptions;
    sort?: ProductSortOptions;
    pagination?: ProductPaginationOptions;
  }) {
    const { filters = {}, sort = {}, pagination = {} } = options || {};
    
    logger.info('Listing products with options:', { filters, sort, pagination });
    
    // Create query builder for complex filtering
    const queryBuilder = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.tags', 'tags');

    // Apply filters
    if (filters.isPublished !== undefined) {
      queryBuilder.andWhere('product.isPublished = :isPublished', { isPublished: filters.isPublished });
    }
    
    if (filters.isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured: filters.isFeatured });
    }

    // Search filter (name and description)
    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
      logger.info('Applied search filter:', { search: filters.search });
    }

    // Category filter
    if (filters.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
      logger.info('Applied category filter:', { categoryId: filters.categoryId });
    }

    // Price range filters
    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
      logger.info('Applied minPrice filter:', { minPrice: filters.minPrice });
    }
    
    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
      logger.info('Applied maxPrice filter:', { maxPrice: filters.maxPrice });
    }

    // Tag filter
    if (filters.tagIds && filters.tagIds.length > 0) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds: filters.tagIds });
      logger.info('Applied tagIds filter:', { tagIds: filters.tagIds });
    }

    // Apply sorting
    if (sort.sortBy && sort.sortOrder) {
      queryBuilder.orderBy(`product.${sort.sortBy}`, sort.sortOrder);
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [products, total] = await queryBuilder.getManyAndCount();
    
    logger.info('Products query result:', { 
      totalFound: total, 
      returnedCount: products.length, 
      page, 
      limit 
    });

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getFeaturedProducts(limit: number = 10) {
    return await this.productRepo.find({
      where: { isFeatured: true, isPublished: true },
      relations: ['category', 'brand', 'variants', 'images'],
      take: limit,
      order: { createdAt: 'DESC' }
    });
  }

  async getSaleProducts(limit: number = 10) {
    const now = new Date();
    return await this.productRepo.find({
      where: {
        isPublished: true,
        salePrice: MoreThanOrEqual(0),
        saleStartDate: LessThanOrEqual(now),
        saleEndDate: MoreThanOrEqual(now)
      },
      relations: ['category', 'brand', 'variants', 'images'],
      take: limit,
      order: { createdAt: 'DESC' }
    });
  }

  async ensureBasicCategories() {
    const basicCategories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' },
      { name: 'Books', slug: 'books', description: 'Books and publications' }
    ];

    for (const categoryData of basicCategories) {
      const existingCategory = await this.categoryRepo.findOneBy({ slug: categoryData.slug });
      if (!existingCategory) {
        const category = this.categoryRepo.create(categoryData);
        await this.categoryRepo.save(category);
        logger.info(`Created basic category: ${categoryData.name}`);
      }
    }
  }
} 