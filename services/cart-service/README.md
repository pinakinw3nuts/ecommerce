# Cart Service

A microservice for managing shopping carts in the e-commerce system.

## Features

- Create and manage user carts and guest carts
- Add, update, and remove items from carts
- Merge guest carts into user carts
- Automatic cart expiration and cleanup
- Product data validation and caching
- Redis integration for improved performance

## Tech Stack

- Node.js with TypeScript
- Fastify for API server
- TypeORM for database access
- PostgreSQL for data storage
- Redis for caching
- Zod for validation
- Swagger for API documentation

## API Endpoints

- `GET /api/v1/cart` - Get current cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:id` - Update cart item quantity
- `DELETE /api/v1/cart/items/:id` - Remove item from cart
- `DELETE /api/v1/cart/items` - Clear cart
- `POST /api/v1/cart/merge` - Merge guest cart into user cart
- `GET /api/v1/health` - Health check endpoint

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `env.example` file.

3. Run database migrations:
   ```
   npm run migration:run
   ```

4. Start the service:
   ```
   npm run dev
   ```

## Development

- `npm run dev` - Start the service in development mode
- `npm run build` - Build the service
- `npm run start` - Start the service in production mode
- `npm run lint` - Run linting
- `npm run test` - Run tests
- `npm run cleanup:carts` - Run the cart cleanup script

## Docker

The service can be run in Docker using the provided Dockerfile:

```
docker build -t cart-service .
docker run -p 3000:3000 cart-service
```

Or using docker-compose:

```
docker-compose up
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the service on | `3000` |
| `HOST` | Host to bind to | `0.0.0.0` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_DATABASE` | Database name | `cart_service` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `PRODUCT_SERVICE_URL` | URL of the product service | `http://localhost:3001` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `JWT_SECRET` | Secret for JWT validation | `secret` |

## Architecture

The cart service follows a clean architecture pattern with the following components:

- **Entities**: Define the data models (Cart, CartItem)
- **Services**: Implement business logic
- **Routes**: Define API endpoints
- **Middleware**: Handle cross-cutting concerns like authentication and validation
- **Config**: Service configuration
- **Utils**: Utility functions

## Cart Lifecycle

1. Guest carts are created for unauthenticated users
2. User carts are created or retrieved for authenticated users
3. Carts expire after a configurable period (default: 7 days)
4. Expired carts are automatically cleaned up

## Maintenance

Run the cart cleanup script periodically to remove expired carts:

```
npm run cleanup:carts
```

This can be scheduled using cron or another scheduling system. 