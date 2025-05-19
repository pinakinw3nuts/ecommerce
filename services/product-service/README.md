# Product Service

## Overview
The Product Service is a microservice responsible for managing product-related operations in the ecommerce system. It provides comprehensive product management capabilities including variants, images, reviews, tags, and more.

## Features
- Complete product CRUD operations
- Product variants management
- Image handling with multiple images per product
- Product categorization and tagging
- Brand management
- Product reviews and ratings
- SEO metadata management
- Sale price and promotional features
- Stock management
- Product bundles and related products
- Attribute management
- Offers and coupons integration

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)
- PostgreSQL (main database)
- Redis (optional, for caching)

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/product_db
PORT=3000
NODE_ENV=development
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
```

### Running with Docker

1. Build the Docker image:
```bash
docker build -t product-service .
```

2. Run the container:
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@postgres:5432/product_db \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  --name product-service \
  product-service
```

### Using Docker Compose
```bash
docker-compose up -d product-service
```

## API Endpoints

### Products

#### GET /api/products
Get all products with pagination and filters
- Query params:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category ID
  - `brand`: Filter by brand ID
  - `search`: Search in name and description
  - `isPublished`: Filter by publication status
  - `isFeatured`: Filter featured products
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `inStock`: Filter by stock availability

#### GET /api/products/:id
Get a single product by ID with all related data

#### POST /api/products
Create a new product
- Requires authentication
- Request body:
```json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "slug": "string",
  "stockQuantity": "number",
  "categoryId": "string",
  "brandId": "string",
  "specifications": "string",
  "keywords": "string[]",
  "seoMetadata": {
    "title": "string",
    "description": "string",
    "keywords": "string[]",
    "ogImage": "string"
  }
}
```

#### PUT /api/products/:id
Update an existing product
- Requires authentication
- Same body structure as POST

#### DELETE /api/products/:id
Delete a product and all associated data
- Requires authentication

### Product Images

#### POST /api/products/:id/images
Upload product images
- Requires authentication
- Multipart form data
- Supports multiple images
- Maximum file size: 5MB per image
- Supported formats: jpg, jpeg, png, webp

#### DELETE /api/products/:id/images/:imageId
Delete a product image
- Requires authentication

### Product Variants

#### GET /api/products/:id/variants
Get all variants of a product

#### POST /api/products/:id/variants
Create a new product variant
- Requires authentication

#### PUT /api/products/:id/variants/:variantId
Update a product variant
- Requires authentication

#### DELETE /api/products/:id/variants/:variantId
Delete a product variant
- Requires authentication

### Reviews

#### GET /api/products/:id/reviews
Get all reviews for a product

#### POST /api/products/:id/reviews
Create a new product review
- Requires authentication

## File Storage

The service supports two storage options for product images:

### Local Storage
- Base directory: `/uploads`
- Organized by product ID: `/uploads/products/{product-id}/`
- Automatic directory creation
- Configured through volume mounting in Docker

### S3 Storage (Recommended for Production)
- Bucket structure: `/{bucket-name}/products/{product-id}/`
- Automatic file management
- Configurable through environment variables

## Error Handling
The service implements standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error

## Security Features
- JWT authentication for protected endpoints
- Role-based access control
- Input validation and sanitization
- File type validation
- Rate limiting on API endpoints
- SQL injection protection through TypeORM
- XSS protection

## Database Schema
The service uses PostgreSQL with TypeORM for:
- Products
- Product Variants
- Product Images
- Categories
- Brands
- Tags
- Reviews
- Attributes
- Product Bundles
- Offers
- Coupons

## License
MIT License 