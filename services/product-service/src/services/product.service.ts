import { AppDataSource } from '../config/dataSource';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { ProductVariant } from '../entities/ProductVariant';
import { generateSlug } from '../utils/slugify';
import { In, Like, Between, FindOptionsOrder, FindOptionsWhere, ILike } from 'typeorm';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  tagIds?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface ProductSortOptions {
  sortBy?: 'name' | 'price' | 'createdAt';
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

  // Helper method to find a category by name or slug
  async getCategoryByNameOrSlug(nameOrSlug: string): Promise<Category | null> {
    try {
      return await this.categoryRepo.findOne({
        where: [
          { name: ILike(`%${nameOrSlug}%`) },
          { slug: ILike(`%${nameOrSlug}%`) }
        ]
      });
    } catch (error) {
      console.error('Error finding category by name or slug:', error);
      return null;
    }
  }

  // Helper method to ensure basic categories exist
  async ensureBasicCategories() {
    try {
      const categories = await this.categoryRepo.find();
      
      if (categories.length === 0) {
        console.log('No categories found, creating basic categories');
        
        const basicCategories = [
          { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
          { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items' },
          { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home and kitchen products' },
          { name: 'Books', slug: 'books', description: 'Books and publications' },
          { name: 'Toys', slug: 'toys', description: 'Toys and games' }
        ];
        
        for (const cat of basicCategories) {
          await this.categoryRepo.save(this.categoryRepo.create(cat));
        }
        
        console.log('Basic categories created');
      }
    } catch (error) {
      console.error('Error ensuring basic categories:', error);
    }
  }

  async listProducts(options?: {
    filters?: ProductFilterOptions;
    sort?: ProductSortOptions;
    pagination?: ProductPaginationOptions;
  }) {
    try {
      // Ensure basic categories exist
      await this.ensureBasicCategories();
      
      // Debug the incoming pagination values
      console.log('Pagination options received:', {
        page: options?.pagination?.page,
        pageType: typeof options?.pagination?.page,
        limit: options?.pagination?.limit,
        limitType: typeof options?.pagination?.limit,
      });
      
      // Parse page and limit to numbers, with fallback defaults
      let page = 1;
      let limit = 10;
      
      try {
        if (options?.pagination?.page !== undefined) {
          const parsedPage = Number(options.pagination.page);
          if (!isNaN(parsedPage)) {
            page = parsedPage;
          }
        }
        
        if (options?.pagination?.limit !== undefined) {
          const parsedLimit = Number(options.pagination.limit);
          if (!isNaN(parsedLimit)) {
            limit = parsedLimit;
          }
        }
      } catch (error) {
        console.error('Error parsing pagination values:', error);
      }
      
      // Debug the parsed values
      console.log('Parsed pagination values:', { page, limit, pageType: typeof page, limitType: typeof limit });
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
      
      // For advanced search functionality, we'll use QueryBuilder
      // First create a query to get the distinct product IDs
      const productIdsQuery = this.productRepo.createQueryBuilder('product')
        .select('product.id', 'id')
        .distinct(true);
      
      // Apply filters to the IDs query
      if (options?.filters) {
        const { search, categoryId, minPrice, maxPrice, tagIds, isFeatured, isPublished } = options.filters;
        
        console.log('Filter options received:', {
          search: search ? `"${search}"` : undefined,
          categoryId,
          minPrice,
          maxPrice,
          tagIds,
          isFeatured,
          isPublished
        });
        
        // Handle text search across multiple fields
        if (search) {
          // Log the search term for debugging
          console.log('Searching with term:', search);
          console.log('Search term type:', typeof search);
          console.log('Search term length:', search.length);
          
          try {
            // Use PostgreSQL full-text search
            const searchTerm = search.trim().split(/\s+/).join(' & ') + ':*';
            productIdsQuery.andWhere(
              `to_tsvector('english', product.name || ' ' || COALESCE(product.description, '')) @@ to_tsquery('english', :search)`,
              { search: searchTerm }
            );
          } catch (error: any) {
            console.log('Full-text search failed, falling back to LIKE search:', error.message);
            
            // Fall back to case-insensitive LIKE search
            productIdsQuery.andWhere(
              '(LOWER(product.name) LIKE LOWER(:likeSearch) OR LOWER(product.description) LIKE LOWER(:likeSearch) OR LOWER(product.slug) LIKE LOWER(:likeSearch))',
              { likeSearch: `%${search}%` }
            );
            
            // Also try to match individual words for better results
            const words = search.split(/\s+/).filter(word => word.length > 2);
            if (words.length > 1) {
              console.log('Searching with individual words:', words);
              
              words.forEach((word, index) => {
                productIdsQuery.orWhere(
                  `(LOWER(product.name) LIKE LOWER(:word${index}) OR LOWER(product.description) LIKE LOWER(:word${index}))`,
                  { [`word${index}`]: `%${word}%` }
                );
              });
            }
          }
        }
        
        // Join with category for filtering
        if (categoryId) {
          productIdsQuery.leftJoin('product.category', 'category');
          console.log('Filtering by category:', categoryId);
          
          try {
            // Log all categories for debugging
            const allCategories = await this.categoryRepo.find();
            console.log('All available categories:', allCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
            
            // Check if categoryId is a UUID (ID) or a string (name/slug)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
            
            if (isUuid) {
              // Filter by category ID
              console.log('Filtering by category ID');
              productIdsQuery.andWhere('category.id = :categoryId', { categoryId });
            } else {
              // First try to find the category by name or slug
              console.log('Looking up category by name or slug');
              const category = await this.getCategoryByNameOrSlug(categoryId);
              
              if (category) {
                console.log('Found category:', category.id, category.name);
                // Use the category ID for more accurate filtering
                productIdsQuery.andWhere('category.id = :foundCategoryId', { foundCategoryId: category.id });
              } else {
                // Fallback to LIKE search if category not found
                console.log('Category not found, using LIKE search');
                try {
                  productIdsQuery.andWhere('(LOWER(category.name) LIKE LOWER(:categoryName) OR LOWER(category.slug) LIKE LOWER(:categorySlug))', 
                    { categoryName: `%${categoryId}%`, categorySlug: `%${categoryId}%` });
                } catch (error) {
                  console.error('Error applying LIKE filter:', error);
                  // If all else fails, don't apply any category filter
                  console.log('Skipping category filter due to error');
                }
              }
            }
          } catch (error) {
            console.error('Error applying category filter:', error);
            // Continue with execution even if category filter fails
          }
        }
        
        // Filter by price range
        if (minPrice !== undefined && maxPrice !== undefined) {
          productIdsQuery.andWhere('product.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice });
        } else if (minPrice !== undefined) {
          productIdsQuery.andWhere('product.price >= :minPrice', { minPrice });
        } else if (maxPrice !== undefined) {
          productIdsQuery.andWhere('product.price <= :maxPrice', { maxPrice });
        }
        
        // Filter by featured status
        if (isFeatured !== undefined) {
          productIdsQuery.andWhere('product.isFeatured = :isFeatured', { isFeatured });
        }
        
        // Filter by published status
        if (isPublished !== undefined) {
          productIdsQuery.andWhere('product.isPublished = :isPublished', { isPublished });
        }
        
        // Filter by tags
        if (tagIds && tagIds.length > 0) {
          productIdsQuery.leftJoin('product.tags', 'tag')
                         .andWhere('tag.id IN (:...tagIds)', { tagIds });
        }
      }
      
      // Apply sorting to the IDs query
      if (options?.sort?.sortBy) {
        const sortOrder = options.sort.sortOrder || 'ASC';
        productIdsQuery.orderBy(`product.${options.sort.sortBy}`, sortOrder);
        productIdsQuery.addOrderBy('product.id', 'ASC');
      } else {
        productIdsQuery.orderBy('product.createdAt', 'DESC');
        productIdsQuery.addOrderBy('product.id', 'ASC');
      }
      
      // Get total count before pagination
      const totalCount = await productIdsQuery.getCount();
      
      // Apply pagination to the IDs query
      productIdsQuery.offset(skip).limit(limit);
      
      // Get the filtered product IDs
      const productIds = await productIdsQuery.getRawMany();
      
      // If no products found, return empty result
      if (!productIds.length) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: page > 1
          }
        };
      }
      
      // Now fetch the complete product data with all relations for these IDs
      const products = await this.productRepo.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.tags', 'tags')
        .leftJoinAndSelect('product.variants', 'variants')
        .whereInIds(productIds.map(p => p.id))
        .orderBy(options?.sort?.sortBy ? `product.${options.sort.sortBy}` : 'product.createdAt', 
                 options?.sort?.sortOrder || 'DESC')
        .addOrderBy('product.id', 'ASC')
        .getMany();
      
      return {
        data: products,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error in listProducts:', error);
      throw error;
    }
  }
} 