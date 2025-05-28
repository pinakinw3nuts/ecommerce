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
  categoryIds?: string;
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
      
      // Use direct SQL query approach to avoid TypeORM's complex query generation
      const conditions = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Log filters for debugging
      if (options?.filters) {
        const { search, categoryId, categoryIds, minPrice, maxPrice, tagIds, isFeatured, isPublished } = options.filters;
        
        console.log('Filter options received:', {
          search: search ? `"${search}"` : undefined,
          categoryId,
          categoryIds,
          minPrice,
          maxPrice,
          tagIds,
          isFeatured,
          isPublished
        });
        
        // Get the effective category ID (use categoryIds if provided, otherwise use categoryId)
        const effectiveCategoryId = categoryIds || categoryId;
        
        // Handle category filtering
        if (effectiveCategoryId) {
          console.log('Filtering by category (raw value):', effectiveCategoryId, 'type:', typeof effectiveCategoryId);
          
          try {
            // Convert to array - handle both string and array inputs
            let categoryIdArray: string[] = [];
            
            if (Array.isArray(effectiveCategoryId)) {
              // Already an array
              categoryIdArray = effectiveCategoryId;
              console.log('Category ID is already an array:', categoryIdArray);
            } else if (typeof effectiveCategoryId === 'string') {
              // Check if it's a comma-separated string
              categoryIdArray = effectiveCategoryId.split(',').map(id => id.trim()).filter(id => id);
              console.log('Parsed category IDs from string:', categoryIdArray);
            }
            
            if (categoryIdArray.length > 1) {
              console.log('Filtering by multiple categories:', categoryIdArray);
              
              // Handle each category ID
              const categoryConditions = [];
              for (const catId of categoryIdArray) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
                
                if (isUuid) {
                  // It's a UUID, use it directly
                  categoryConditions.push(`"categoryId" = $${paramIndex}`);
                  params.push(catId);
                  paramIndex++;
                } else {
                  // Try to find the category by name or slug
                  const category = await this.getCategoryByNameOrSlug(catId);
                  if (category) {
                    categoryConditions.push(`"categoryId" = $${paramIndex}`);
                    params.push(category.id);
                    paramIndex++;
                  }
                }
              }
              
              if (categoryConditions.length > 0) {
                // Use OR to include products matching any of the specified categories
                conditions.push(`(${categoryConditions.join(' OR ')})`);
              }
            } else {
              // Single category - existing logic
              const singleCategoryId = categoryIdArray[0];
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(singleCategoryId);
              
              if (isUuid) {
                // Filter by category ID directly on the foreign key
                console.log('Filtering by category ID');
                conditions.push(`"categoryId" = $${paramIndex}`);
                params.push(singleCategoryId);
                paramIndex++;
              } else {
                // First try to find the category by name or slug
                console.log('Looking up category by name or slug');
                const category = await this.getCategoryByNameOrSlug(singleCategoryId);
                
                if (category) {
                  console.log('Found category:', category.id, category.name);
                  conditions.push(`"categoryId" = $${paramIndex}`);
                  params.push(category.id);
                  paramIndex++;
                } else {
                  // If we can't find the category, don't apply the filter
                  console.log('Category not found, skipping filter');
                }
              }
            }
          } catch (error) {
            console.error('Error applying category filter:', error);
          }
        }
        
        // Handle text search
        if (search) {
          // Log the search term for debugging
          console.log('Searching with term:', search);
          console.log('Search term type:', typeof search);
          console.log('Search term length:', search.length);
          
          try {
            // Simple LIKE search for PostgreSQL
            const searchTerm = `%${search}%`;
            conditions.push(`(
              LOWER("name") LIKE LOWER($${paramIndex}) OR 
              LOWER("description") LIKE LOWER($${paramIndex}) OR 
              LOWER("slug") LIKE LOWER($${paramIndex})
            )`);
            params.push(searchTerm);
            paramIndex++;
          } catch (error) {
            console.error('Error applying search filter:', error);
          }
        }
        
        // Filter by price range
        if (minPrice !== undefined && maxPrice !== undefined) {
          conditions.push(`"price" BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(minPrice, maxPrice);
          paramIndex += 2;
        } else if (minPrice !== undefined) {
          conditions.push(`"price" >= $${paramIndex}`);
          params.push(minPrice);
          paramIndex++;
        } else if (maxPrice !== undefined) {
          conditions.push(`"price" <= $${paramIndex}`);
          params.push(maxPrice);
          paramIndex++;
        }
        
        // Filter by featured status
        if (isFeatured !== undefined) {
          conditions.push(`"isFeatured" = $${paramIndex}`);
          params.push(isFeatured);
          paramIndex++;
        }
        
        // Filter by published status
        if (isPublished !== undefined) {
          conditions.push(`"isPublished" = $${paramIndex}`);
          params.push(isPublished);
          paramIndex++;
        }
        
        // Filter by tags
        if (tagIds && tagIds.length > 0) {
          // For each tag, we'll add a parameter
          const tagParams = tagIds.map((_, idx) => `$${paramIndex + idx}`).join(',');
          conditions.push(`"id" IN (
            SELECT "productId" FROM product_tags_tag WHERE "tagId" IN (${tagParams})
          )`);
          
          // Add all tag IDs as parameters
          params.push(...tagIds);
          paramIndex += tagIds.length;
        }
      }
      
      // Build the WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Build order by clause
      const sortField = options?.sort?.sortBy || 'createdAt';
      const sortDirection = options?.sort?.sortOrder || 'DESC';
      const orderByClause = `ORDER BY "${sortField}" ${sortDirection}, "id" ASC`;
      
      // Count query - do not use joins
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM product
        ${whereClause}
      `;
      
      console.log('Executing count query:', countQuery, 'with params:', params);
      
      const countResult = await this.productRepo.query(countQuery, params);
      const totalCount = parseInt(countResult[0].count);
      
      // If no products, return empty result
      if (totalCount === 0) {
        return {
          data: [],
          meta: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 0,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1
          }
        };
      }
      
      // Main query to get product IDs with pagination - do not use joins
      const idsQuery = `
        SELECT id
        FROM product
        ${whereClause}
        ${orderByClause}
        LIMIT ${limit} OFFSET ${skip}
      `;
      
      console.log('Executing IDs query:', idsQuery, 'with params:', params);
      
      const productIdsResult = await this.productRepo.query(idsQuery, params);
      
      // If no products found after pagination, return empty result
      if (productIdsResult.length === 0) {
        return {
          data: [],
          meta: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 0,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1
          }
        };
      }
      
      // Extract the IDs
      const productIds = productIdsResult.map((row: {id: string}) => row.id);
      
      // Then use TypeORM's repository to fetch complete data with relations
      const products = await this.productRepo.find({
        where: { id: In(productIds) },
        relations: ['category', 'tags', 'variants'],
        order: {
          ...(options?.sort?.sortBy ? { [options.sort.sortBy]: options.sort.sortOrder || 'ASC' } : { createdAt: 'DESC' }),
          id: 'ASC'
        }
      });
      
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