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
- Advanced searching, filtering, sorting, and pagination

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

### Public Endpoints

#### GET /api/v1/products

List all products with support for filtering, sorting, and pagination.

**Query Parameters:**

| Parameter    | Type    | Description                                     |
|-------------|---------|-------------------------------------------------|
| page        | integer | Page number (starts from 1)                     |
| limit       | integer | Number of items per page                        |
| sortBy      | string  | Field to sort by (name, price, createdAt)       |
| sortOrder   | string  | Sort direction (ASC, DESC)                      |
| search      | string  | Search term for product name, description, slug |
| categoryId  | string  | Filter by category ID                           |
| minPrice    | number  | Minimum price filter                            |
| maxPrice    | number  | Maximum price filter                            |
| tagIds      | string  | Comma-separated list of tag IDs                 |
| isFeatured  | boolean | Filter by featured status                       |
| isPublished | boolean | Filter by published status                      |

**Example Request:**

```
GET /api/v1/products?page=1&limit=10&sortBy=price&sortOrder=ASC&search=laptop&minPrice=500&maxPrice=1500&categoryId=123&isFeatured=true
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Dell XPS 13",
      "description": "Powerful laptop with great features",
      "price": 1299.99,
      "slug": "dell-xps-13",
      "mediaUrl": "https://example.com/images/dell-xps-13.jpg",
      "isFeatured": true,
      "isPublished": true,
      "category": {
        "id": "123",
        "name": "Laptops",
        "description": "Portable computers"
      },
      "variants": [
        {
          "id": "456",
          "name": "16GB RAM, 512GB SSD",
          "sku": "XPS-16-512",
          "price": 1299.99,
          "stock": 10
        }
      ],
      "tags": [
        {
          "id": "789",
          "name": "Dell"
        }
      ]
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### GET /api/v1/products/:identifier

Get a product by ID or slug.

### Protected Endpoints (Requires Authentication)

#### GET /api/v1/admin/products

Same as public endpoint but with authentication, accessible through the admin API.

#### POST /api/v1/admin/products

Create a new product.

#### PUT /api/v1/admin/products/:identifier

Update an existing product.

#### DELETE /api/v1/admin/products/:identifier

Delete a product.

#### POST /api/v1/admin/products/:identifier/image

Upload a product image.

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

## Implementation Details

### Searching

The search functionality allows searching across multiple fields:
- Product name
- Product description
- Product slug

### Filtering

Products can be filtered by:
- Category
- Price range (min/max)
- Tags
- Featured status
- Published status

### Sorting

Products can be sorted by:
- Name (alphabetically)
- Price (low to high or high to low)
- Creation date (newest first or oldest first)

### Pagination

Results are paginated with metadata including:
- Total number of products
- Current page
- Items per page
- Total pages
- Next/previous page indicators

## Database Indexes

The following indexes have been added to optimize query performance:
- Full-text index on name and description
- Index on price for range queries
- Index on createdAt for sorting
- Composite index on isPublished and isFeatured
- Index on name for searching
- Unique index on slug for lookups 