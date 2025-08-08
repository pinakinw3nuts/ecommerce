import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  // Simplified UUID validation - just check basic format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

const productService = new ProductService();

// Helper function to transform a product entity into a clean response object
function formatProductResponse(product: any) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    slug: product.slug,
    mediaUrl: product.mediaUrl,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    salePrice: product.salePrice,
    saleStartDate: product.saleStartDate,
    saleEndDate: product.saleEndDate,
    stockQuantity: product.stockQuantity,
    isInStock: product.isInStock,
    specifications: product.specifications,
    keywords: product.keywords,
    seoMetadata: product.seoMetadata || null,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description
    } : null,
    brand: product.brand ? {
      id: product.brand.id,
      name: product.brand.name
    } : null,
    variants: Array.isArray(product.variants) ? product.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
      sku: v.sku, 
      price: v.price,
      stock: v.stock
    })) : [],
    tagIds: Array.isArray(product.tags) ? product.tags.map((t: any) => t.id) : [],
    tags: Array.isArray(product.tags) ? product.tags.map((t: any) => ({
      id: t.id,
      name: t.name
    })) : [],
    images: Array.isArray(product.images) ? product.images : [],
    attributes: Array.isArray(product.attributes) ? product.attributes : [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

// Schema for creating/updating products
const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  mediaUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string(),
  tagIds: z.array(z.string()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    stock: z.number(),
  })).optional(),
  salePrice: z.number().optional(),
  saleStartDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  saleEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  stockQuantity: z.number().optional(),
  isInStock: z.boolean().optional(),
  specifications: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  seoMetadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
  brandId: z.string().optional(),
});

// Schema for query parameters
const productQuerySchema = z.object({
  // Pagination
  page: z.string().or(z.number()).transform(val => Number(val) || 1).optional().default(1),
  limit: z.string().or(z.number()).transform(val => Number(val) || 20).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  
  // Filtering
  search: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.string().optional(),
  minPrice: z.string().or(z.number()).transform(val => Number(val)).optional(),
  maxPrice: z.string().or(z.number()).transform(val => Number(val)).optional(),
  tagIds: z.array(z.string()).optional(),
  isFeatured: z.string().transform(val => val === 'true').optional(),
  isPublished: z.string().transform(val => val === 'true').optional(),
});

export default async function productRoutes(fastify: FastifyInstance) {
  // Test endpoint
  fastify.get('/test', {
    schema: {
      tags: ['Products'],
      summary: 'Products test endpoint',
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, timestamp: { type: 'string' } } } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      message: 'Product routes are working',
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/products - List products with filtering, sorting, and pagination
  fastify.get('/', {
    schema: {
      tags: ['Products'],
      summary: 'List products',
      response: { 200: { type: 'object', additionalProperties: true } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse query parameters using Zod schema
      const queryParams = productQuerySchema.parse(request.query);
      
      logger.info('Parsed query parameters:', queryParams);

      // Build options for service
      const options = {
        filters: {
          search: queryParams.search,
          categoryId: queryParams.categoryId,
          minPrice: queryParams.minPrice,
          maxPrice: queryParams.maxPrice,
          tagIds: queryParams.tagIds,
          isFeatured: queryParams.isFeatured,
          isPublished: queryParams.isPublished,
        },
        sort: {
          sortBy: queryParams.sortBy,
          sortOrder: queryParams.sortOrder,
        },
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
        },
      };

      const result = await productService.listProducts(options);
      const formattedProducts = result.products.map(formatProductResponse);

      return reply.send({
        success: true,
        data: formattedProducts,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error listing products:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid query parameters',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to list products',
        error: 'INTERNAL_ERROR',
        details: (error as Error).message
      });
    }
  });

  // GET /api/products/featured - Get featured products
  fastify.get('/featured', {
    schema: {
      tags: ['Products'],
      summary: 'Get featured products',
      response: { 200: { type: 'object', additionalProperties: true } }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit) : 10;
      
      const products = await productService.getFeaturedProducts(limit);
      const formattedProducts = products.map(formatProductResponse);

      return reply.send({
        success: true,
        data: formattedProducts,
      });
    } catch (error) {
      logger.error('Error getting featured products:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get featured products',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // GET /api/products/sale - Get products on sale
  fastify.get('/sale', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit) : 10;
      
      const products = await productService.getSaleProducts(limit);
      const formattedProducts = products.map(formatProductResponse);

      return reply.send({
        success: true,
        data: formattedProducts,
      });
    } catch (error) {
      logger.error('Error getting sale products:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get sale products',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // GET /api/products/:id - Get product by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate UUID format
      if (!isValidUUID(id)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product ID format',
          error: 'INVALID_UUID'
        });
      }

      const product = await productService.getProductById(id);

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      return reply.send({
        success: true,
        data: formatProductResponse(product),
      });
    } catch (error) {
      logger.error('Error getting product by ID:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get product',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // GET /api/products/slug/:slug - Get product by slug
  fastify.get('/slug/:slug', async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      const product = await productService.getProductBySlug(slug);

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      return reply.send({
        success: true,
        data: formatProductResponse(product),
      });
    } catch (error) {
      logger.error('Error getting product by slug:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get product',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // POST /api/products - Create new product
  fastify.post('/', { preHandler: [requireAdmin()] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const productData = productSchema.parse(request.body);
      
      const product = await productService.createProduct({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        mediaUrl: productData.mediaUrl,
        isFeatured: productData.isFeatured,
        isPublished: productData.isPublished,
        categoryId: productData.categoryId,
        tagIds: productData.tagIds,
        variants: productData.variants?.map((variant: any) => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
        })) || [],
        brandId: productData.brandId,
        salePrice: productData.salePrice,
        saleStartDate: productData.saleStartDate,
        saleEndDate: productData.saleEndDate,
        stockQuantity: productData.stockQuantity,
      });
      
      logger.info('Product created successfully:', { productId: product.id, name: product.name });

      return reply.status(201).send({
        success: true,
        message: 'Product created successfully',
        data: formatProductResponse(product),
      });
    } catch (error) {
      logger.error('Error creating product:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to create product',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // PUT /api/products/:id - Update product
  fastify.put('/:id', { preHandler: [requireAdmin()] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate UUID format
      if (!isValidUUID(id)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product ID format',
          error: 'INVALID_UUID'
        });
      }
      
      const updateData = productSchema.partial().parse(request.body);
      
      const product = await productService.updateProduct(id, {
        ...updateData,
        variants: updateData.variants?.map((variant: any) => ({
          id: variant.id,
          name: variant.name || '',
          sku: variant.sku || '',
          price: variant.price || 0,
          stock: variant.stock || 0,
        })) || undefined,
      });
      
      logger.info('Product updated successfully:', { productId: id });

      return reply.send({
        success: true,
        message: 'Product updated successfully',
        data: formatProductResponse(product),
      });
    } catch (error) {
      logger.error('Error updating product:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to update product',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // DELETE /api/products/:id - Delete product
  fastify.delete('/:id', { preHandler: [requireAdmin()] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate UUID format
      if (!isValidUUID(id)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid product ID format',
          error: 'INVALID_UUID'
        });
      }
      
      const result = await productService.deleteProduct(id);
      
      if (result.affected === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Product not found',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      logger.info('Product deleted successfully:', { productId: id });

      return reply.send({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting product:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete product',
        error: 'INTERNAL_ERROR'
      });
    }
  });
} 