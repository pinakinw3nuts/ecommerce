# API Gateway for E-commerce Microservices

This API Gateway serves as the entry point for all client requests to the e-commerce microservices platform.

## Features

- Routes requests to appropriate microservices
- Handles authentication and authorization
- Rate limiting with Redis (falls back to in-memory when Redis is unavailable)
- Request logging and monitoring
- Error handling and standardization

## Services Architecture

The API Gateway routes requests to the following microservices:

- **Auth Service** - Authentication and authorization (`/api/auth/*`)
- **User Service** - User management (`/api/users/*`)
- **Product Service** - Product catalog (`/api/products/*`)
- **Cart Service** - Shopping cart management (`/api/cart/*`)
- **Checkout Service** - Checkout process (`/api/checkout/*`)
- **Order Service** - Order management (`/api/orders/*`)
- **Payment Service** - Payment processing (`/api/payments/*`)
- **Shipping Service** - Shipping options and tracking (`/api/shipping/*`)
- **Inventory Service** - Inventory management (`/api/inventory/*`)
- **Company Service** - Company information (`/api/company/*`)
- **Pricing Service** - Pricing and discounts (`/api/pricing/*`)
- **Admin Service** - Admin dashboard and operations (`/api/admin/*`)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Redis (optional, falls back to in-memory store)

### Installation

```bash
# Install dependencies
pnpm install

# Install dependencies for all microservices
pnpm run install:deps
```

### Running the API Gateway

```bash
# Development mode
pnpm run dev

# Development mode without Redis (uses in-memory rate limiting)
pnpm run dev:no-redis

# Development mode on a different port (default: 3030)
pnpm run dev:port [port]
# Example: pnpm run dev:port 3333

# Production mode
pnpm run build
pnpm start
```

### Starting All Microservices

To start all available microservices and the API Gateway:

```bash
pnpm run dev:all
```

### Service Management

```bash
# Check which services are running
pnpm run check:services

# Start a specific service
pnpm run ensure:service <service-name>
# Example: pnpm run ensure:service auth-service

# Start all microservices without the API gateway
pnpm run start:services

# Install dependencies for a specific service
pnpm run install:deps <service-name>
# Example: pnpm run install:deps auth-service
```

## Development

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server configuration
PORT=3000
NODE_ENV=development

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=*

# Service URLs (for Docker)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3003
CART_SERVICE_URL=http://cart-service:3004
CHECKOUT_SERVICE_URL=http://checkout-service:3005
ORDER_SERVICE_URL=http://order-service:3006
PAYMENT_SERVICE_URL=http://payment-service:3007
SHIPPING_SERVICE_URL=http://shipping-service:3008
INVENTORY_SERVICE_URL=http://inventory-service:3009
COMPANY_SERVICE_URL=http://company-service:3010
PRICING_SERVICE_URL=http://pricing-service:3011
ADMIN_SERVICE_URL=http://admin-service:3012
```

### Development Mode

In development mode, the API Gateway automatically uses `localhost` URLs with the appropriate ports instead of the Docker service names.

## API Documentation

### Health Check

- `GET /health` - Basic health check
- `GET /health/details` - Detailed health status with metrics

### Service Status

- `GET /api/status` - Get status of all registered API routes

## Scripts

- `pnpm run dev` - Start the API Gateway in development mode
- `pnpm run dev:no-redis` - Start the API Gateway without Redis (in-memory rate limiting)
- `pnpm run dev:port [port]` - Start the API Gateway on a different port (default: 3030)
- `pnpm run dev:all` - Start all available microservices and the API Gateway
- `pnpm run start:services` - Start all available microservices without the API Gateway
- `pnpm run check:services` - Check which services are currently running
- `pnpm run check:gateway` - Check if the API Gateway is running and find processes using its port
- `pnpm run check:redis` - Check Redis connection status
- `pnpm run ensure:service <service-name>` - Start a specific service if it's not running
- `pnpm run install:deps [service-name]` - Install dependencies for all services or a specific service
- `pnpm run diagnose` - Interactive script to diagnose and fix common issues
- `pnpm run build` - Build the project
- `pnpm run start` - Start the API Gateway in production mode
- `pnpm run start:all` - Start all microservices and the API Gateway in production mode

## Troubleshooting

### Redis Connection Issues

If Redis is unavailable, the API Gateway will automatically fall back to using an in-memory store for rate limiting. This is suitable for development but not recommended for production.

You can check Redis connection status with:

```bash
pnpm run check:redis
```

If you don't need Redis, you can start the API Gateway without it:

```bash
pnpm run dev:no-redis
```

### Service Dependency Issues

If services fail to start due to missing dependencies, install them with:

```bash
pnpm run install:deps
```

For a specific service:

```bash
pnpm run install:deps <service-name>
```

### Service Connection Issues

When a microservice is unavailable, the API Gateway will return a 503 Service Unavailable response. Check the logs for more details about which service is failing.

You can check which services are running:

```bash
pnpm run check:services
```

To start a specific service:

```bash
pnpm run ensure:service <service-name>
```

### Path Routing Issues

If you're getting 404 errors, ensure that:

1. The service is running (use `pnpm run check:services`)
2. The path you're requesting is correctly mapped in the API Gateway
3. The target service has a route that matches the path being forwarded 