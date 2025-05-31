# Wishlist Service

A microservice for managing user wishlists in an e-commerce platform. This service allows users to save products they're interested in for future reference.

## Features

- Add products to wishlist
- Remove products from wishlist
- Get wishlist items with pagination
- Check if a product is in the wishlist
- Clear the entire wishlist
- Get wishlist item count
- Health check endpoint

## API Endpoints

### Authentication

All endpoints require authentication via JWT token in the `Authorization` header.

### Wishlist Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wishlist` | Add a product to the wishlist |
| DELETE | `/api/wishlist/:id` | Remove a specific product from the wishlist |
| GET | `/api/wishlist` | Get all wishlist items with pagination |
| GET | `/api/wishlist/check` | Check if a product is in the wishlist |
| DELETE | `/api/wishlist` | Clear the entire wishlist |
| GET | `/api/wishlist/count` | Get the total number of items in the wishlist |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check service health including database connection |

## Request/Response Examples

### Add to Wishlist

**Request:**
```json
POST /api/wishlist
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "variantId": "223e4567-e89b-12d3-a456-426614174001",
  "productName": "Example Product",
  "productImage": "https://example.com/image.jpg",
  "price": 99.99,
  "metadata": {
    "color": "blue",
    "size": "medium"
  }
}
```

**Response:**
```json
{
  "message": "Product added to wishlist",
  "data": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "userId": "423e4567-e89b-12d3-a456-426614174003",
    "productId": "123e4567-e89b-12d3-a456-426614174000",
    "variantId": "223e4567-e89b-12d3-a456-426614174001",
    "productName": "Example Product",
    "productImage": "https://example.com/image.jpg",
    "price": 99.99,
    "metadata": {
      "color": "blue",
      "size": "medium"
    },
    "createdAt": "2023-06-15T14:23:45.123Z",
    "updatedAt": "2023-06-15T14:23:45.123Z"
  }
}
```

### Get Wishlist

**Request:**
```
GET /api/wishlist?page=1&limit=10&sortBy=createdAt&order=DESC
```

**Response:**
```json
{
  "message": "Wishlist retrieved successfully",
  "data": {
    "items": [
      {
        "id": "323e4567-e89b-12d3-a456-426614174002",
        "userId": "423e4567-e89b-12d3-a456-426614174003",
        "productId": "123e4567-e89b-12d3-a456-426614174000",
        "variantId": "223e4567-e89b-12d3-a456-426614174001",
        "productName": "Example Product",
        "productImage": "https://example.com/image.jpg",
        "price": 99.99,
        "metadata": {
          "color": "blue",
          "size": "medium"
        },
        "createdAt": "2023-06-15T14:23:45.123Z",
        "updatedAt": "2023-06-15T14:23:45.123Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Running Locally with Docker

### Prerequisites

- Docker and Docker Compose installed
- Port 3013 available on your machine

### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd services/wishlist-service
   ```

2. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

3. The service will be available at `http://localhost:3013`

4. API documentation is available at `http://localhost:3013/documentation`

5. To check the service health:
   ```bash
   curl http://localhost:3013/health
   ```

6. To stop the service:
   ```bash
   docker-compose down
   ```

### Environment Variables

The following environment variables can be configured in the `.env` file or in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port the service listens on | 3013 |
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:password@postgres:5432/wishlist_db |
| JWT_SECRET | Secret key for JWT authentication | your-secret-key-min-10-chars |
| CORS_ORIGINS | Comma-separated list of allowed origins | http://localhost:3000,http://localhost:8080 |
| NODE_ENV | Environment (development, production, test) | production |

## Development

### Without Docker

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `env.example`

3. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests

```bash
npm test
```

## Database Schema

The wishlist service uses a PostgreSQL database with the following schema:

### Wishlist Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | User ID (foreign key) |
| productId | uuid | Product ID (foreign key) |
| variantId | uuid | Product variant ID (nullable) |
| productName | varchar | Product name (cached) |
| productImage | varchar | Product image URL (cached) |
| price | decimal | Product price (cached) |
| metadata | jsonb | Additional product data |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

## Architecture

The wishlist service follows a clean architecture pattern with the following layers:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Entities**: Define the data model
- **Repositories**: Handle database operations (via TypeORM)

## Technologies

- Node.js
- TypeScript
- Fastify
- TypeORM
- PostgreSQL
- Docker
- Vitest for testing 