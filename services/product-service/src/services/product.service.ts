import { AppDataSource } from '../config/dataSource';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';
import { ProductVariant } from '../entities/ProductVariant';
import { generateSlug } from '../utils/slugify';
import { In, Like, Between, FindOptionsOrder, FindOptionsWhere, ILike } from 'typeorm';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Brand } from '../entities/Brand';

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
  }) {
    console.log('Creating product with data:', JSON.stringify(data, null, 2));
    
    const slug = generateSlug(data.name);
    const category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
    
    // Fetch tags if provided
    let tags: Tag[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      console.log(`Fetching ${data.tagIds.length} tags with IDs:`, data.tagIds);
      tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
      console.log(`Found ${tags.length} tags`);
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
    
    console.log('Created product entity with fields:', Object.keys(product));
    
    // Log SEO metadata if provided
    if (data.seoMetadata) {
      console.log('SEO Metadata:', JSON.stringify(data.seoMetadata, null, 2));
    }
    
    // Set brand if brandId is provided
    if (data.brandId) {
      console.log(`Fetching brand with ID: ${data.brandId}`);
      const brandRepo = AppDataSource.getRepository(Brand);
      const brand = await brandRepo.findOneBy({ id: data.brandId });
      if (brand) {
        console.log(`Found brand: ${brand.name}`);
        product.brand = brand;
      } else {
        console.log(`Brand with ID ${data.brandId} not found`);
      }
    }
    
    // Create variants if provided
    if (data.variants && data.variants.length > 0) {
      console.log(`Creating ${data.variants.length} product variants`);
      product.variants = data.variants.map(v => this.variantRepo.create(v));
    }
    
    // Save and return the product
    console.log('Saving product to database...');
    const savedProduct = await this.productRepo.save(product);
    console.log(`Product saved with ID: ${savedProduct.id}`);
    return savedProduct;
  }

  async getProductById(id: string) {
    console.log(`Service: Getting product by id ${id}`);
    try {
      const product = await this.productRepo.findOne({
        where: { id },
        relations: ['category', 'tags', 'variants', 'brand', 'images', 'attributes'],
      });
      
      console.log(`Service: Product found: ${!!product}, with fields:`, product ? Object.keys(product) : 'none');
      
      if (product) {
        // Ensure all relations are properly loaded
        console.log(`Service: Relations loaded:`, {
          hasCategory: !!product.category,
          hasTags: Array.isArray(product.tags) ? product.tags.length : 0,
          hasVariants: Array.isArray(product.variants) ? product.variants.length : 0,
          hasBrand: !!product.brand,
          hasImages: Array.isArray(product.images) ? product.images.length : 0,
          hasAttributes: Array.isArray(product.attributes) ? product.attributes.length : 0
        });
      }
      
      return product;
    } catch (error) {
      console.error(`Service: Error getting product by id:`, error);
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
    console.log(`Updating product ${id} with data:`, JSON.stringify(data, null, 2));
    
    const product = await this.productRepo.findOneOrFail({ 
      where: { id }, 
      relations: ['variants', 'tags', 'category', 'brand', 'attributes', 'images'] 
    });
    
    console.log(`Found product: ${product.name}, with original fields:`, Object.keys(product));
    
    if (data.name) {
      product.name = data.name;
      product.slug = generateSlug(data.name);
    }
    
    // Update basic fields if provided
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.mediaUrl !== undefined) product.mediaUrl = data.mediaUrl;
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
    if (data.isPublished !== undefined) product.isPublished = data.isPublished;
    
    // Update additional fields if provided
    if (data.salePrice !== undefined) {
      console.log(`Updating salePrice to: ${data.salePrice}`);
      product.salePrice = data.salePrice;
    }
    if (data.saleStartDate !== undefined) {
      console.log(`Updating saleStartDate to: ${data.saleStartDate}`);
      product.saleStartDate = data.saleStartDate;
    }
    if (data.saleEndDate !== undefined) {
      console.log(`Updating saleEndDate to: ${data.saleEndDate}`);
      product.saleEndDate = data.saleEndDate;
    }
    if (data.stockQuantity !== undefined) {
      console.log(`Updating stockQuantity to: ${data.stockQuantity}`);
      product.stockQuantity = data.stockQuantity;
    }
    if (data.isInStock !== undefined) {
      console.log(`Updating isInStock to: ${data.isInStock}`);
      product.isInStock = data.isInStock;
    }
    if (data.specifications !== undefined) {
      console.log(`Updating specifications`);
      product.specifications = data.specifications;
    }
    if (data.keywords !== undefined) {
      console.log(`Updating keywords: ${data.keywords}`);
      product.keywords = data.keywords;
    }
    if (data.seoMetadata !== undefined) {
      console.log(`Updating seoMetadata:`, JSON.stringify(data.seoMetadata, null, 2));
      product.seoMetadata = data.seoMetadata;
    }
    
    // Update category if categoryId is provided
    if (data.categoryId) {
      console.log(`Updating category to ID: ${data.categoryId}`);
      product.category = await this.categoryRepo.findOneByOrFail({ id: data.categoryId });
    }
    
    // Update brand if brandId is provided
    if (data.brandId) {
      console.log(`Updating brand to ID: ${data.brandId}`);
      const brandRepo = AppDataSource.getRepository(Brand);
      product.brand = await brandRepo.findOneByOrFail({ id: data.brandId });
    }
    
    // Update tags if tagIds is provided
    if (data.tagIds) {
      console.log(`Updating tags to IDs: ${data.tagIds}`);
      product.tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
    }
    
    // Update variants if provided
    if (data.variants) {
      console.log(`Updating ${data.variants.length} variants`);
      // Remove old variants and add new ones
      await this.variantRepo.delete({ product: { id: product.id } });
      product.variants = data.variants.map(v => this.variantRepo.create({
        ...v,
        product
      }));
    }
    
    console.log(`Saving updated product...`);
    const savedProduct = await this.productRepo.save(product);
    console.log(`Product updated successfully, with fields:`, Object.keys(savedProduct));
    return savedProduct;
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
      console.log(`Service: Fetching products with IDs:`, productIds);
      const products = await this.productRepo.find({
        where: { id: In(productIds) },
        relations: ['category', 'tags', 'variants', 'brand', 'images', 'attributes'],
        order: {
          ...(options?.sort?.sortBy ? { [options.sort.sortBy]: options.sort.sortOrder || 'ASC' } : { createdAt: 'DESC' }),
          id: 'ASC'
        }
      });
      
      // Log the products retrieved and their relations
      console.log(`Service: Retrieved ${products.length} products with relations`);
      if (products.length > 0) {
        // Log the first product's fields as a sample
        const sample = products[0];
        console.log(`Service: Sample product fields:`, Object.keys(sample));
        console.log(`Service: Sample product relations:`, {
          hasCategory: !!sample.category,
          hasTags: Array.isArray(sample.tags) ? sample.tags.length : 0,
          hasVariants: Array.isArray(sample.variants) ? sample.variants.length : 0,
          hasBrand: !!sample.brand,
          hasImages: Array.isArray(sample.images) ? sample.images.length : 0,
          hasAttributes: Array.isArray(sample.attributes) ? sample.attributes.length : 0
        });
      }
      
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