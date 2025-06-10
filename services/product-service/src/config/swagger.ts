import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

const version = '1.0.0';

// Get host and port from environment variables with defaults
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '3000';

export const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: 'Product Service API',
      description: 'Product service API documentation',
      version,
    },
    servers: [
      {
        url: `http://${HOST}:${PORT}/api/v1`
      }
    ],
    tags: [
      { name: 'products', description: 'Product related end-points' },
      { name: 'categories', description: 'Category related end-points' },
      { name: 'reviews', description: 'Review related end-points' },
      { name: 'attributes', description: 'Attribute related end-points' },
      { name: 'admin-products', description: 'Admin product management end-points' },
      { name: 'admin-categories', description: 'Admin category management end-points' },
      { name: 'admin-reviews', description: 'Admin review management end-points' },
      { name: 'admin-attributes', description: 'Admin attribute management end-points' },
      { name: 'admin-brands', description: 'Admin brand management end-points' },
      { name: 'admin-tags', description: 'Admin tag management end-points' },
      { name: 'admin-coupons', description: 'Admin coupon management end-points' }
    ],
    components: {
      schemas: {
        ProductReview: {
          type: 'object',
          required: ['id', 'userId', 'userName', 'rating', 'comment'],
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            userName: { type: 'string' },
            rating: { type: 'number' },
            comment: { type: 'string' },
            images: { 
              type: 'array',
              items: { type: 'string' }
            },
            isVerifiedPurchase: { type: 'boolean', default: false },
            helpfulCount: { type: 'number', default: 0 },
            isPublished: { type: 'boolean', default: true },
            metadata: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                deviceType: { type: 'string' },
                purchaseDate: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductAttribute: {
          type: 'object',
          required: ['id', 'name', 'type'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['select', 'multiple', 'text', 'number', 'boolean']
            },
            isFilterable: { type: 'boolean', default: true },
            isRequired: { type: 'boolean', default: false },
            sortOrder: { type: 'integer', default: 0 },
            isActive: { type: 'boolean', default: true },
            values: {
              type: 'array',
              items: { $ref: '#/components/schemas/AttributeValue' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AttributeValue: {
          type: 'object',
          required: ['id', 'value'],
          properties: {
            id: { type: 'string' },
            value: { type: 'string' },
            displayValue: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                hexColor: { type: 'string' },
                imageUrl: { type: 'string' },
                sortOrder: { type: 'integer' }
              }
            },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          required: ['id', 'name', 'slug', 'description', 'price'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            mediaUrl: { type: 'string' },
            isFeatured: { type: 'boolean', default: false },
            isPublished: { type: 'boolean', default: true },
            salePrice: { type: 'number' },
            saleStartDate: { type: 'string', format: 'date-time' },
            saleEndDate: { type: 'string', format: 'date-time' },
            stockQuantity: { type: 'integer', default: 0 },
            isInStock: { type: 'boolean', default: true },
            specifications: { type: 'string' },
            keywords: { 
              type: 'array',
              items: { type: 'string' }
            },
            rating: { type: 'number', default: 0 },
            reviewCount: { type: 'integer', default: 0 },
            seoMetadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: {
                  type: 'array',
                  items: { type: 'string' }
                },
                ogImage: { type: 'string' }
              }
            },
            attributes: {
              type: 'array',
              items: { $ref: '#/components/schemas/AttributeValue' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  }
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
}; 