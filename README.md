# E-Commerce Microservices Platform

A comprehensive e-commerce platform built with microservices architecture using TypeScript, Node.js, and modern tools.

## Architecture Overview

This platform is built with a microservices architecture, consisting of:

- **API Gateway**: Central entry point for all client requests
- **Authentication Service**: Handles user authentication and authorization
- **User Service**: Manages user profiles and data
- **Product Service**: Handles product catalog and information
- **Cart Service**: Manages shopping cart functionality
- **Checkout Service**: Handles the checkout process
- **Order Service**: Manages orders
- **Payment Service**: Handles payment processing
- **Shipping Service**: Manages shipping options and fulfillment
- **Inventory Service**: Tracks product inventory
- **CMS Service**: Content management using Payload CMS
- **Admin Service**: Provides admin functionality
- **Pricing Service**: Handles product pricing
- **Company Service**: Manages company information
- **Wishlist Service**: Handles user wishlists
- **Review Service**: Manages product reviews
- **Notification Service**: Handles user notifications

## Frontend Applications

- **Storefront**: Next.js application for customers
- **Admin Panel**: Next.js application for administrators

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- pnpm (or npm/yarn)
- PostgreSQL

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ecommerce-platform.git
cd ecommerce-platform
```

### 2. Set up environment variables

```bash
cp env.example .env
```

Edit `.env` file to set your environment variables.

### 3. Deploy using our deployment script

For Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

For Windows:
```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\dev.ps1
```

### 4. Access services

- API Gateway: http://localhost:3000
- Storefront: http://localhost:3100
- Admin Panel: http://localhost:3101
- CMS Admin: http://localhost:3016/admin
- PgAdmin (Development): http://localhost:8080
- Redis Commander (Development): http://localhost:8081

## Development

### Development Environment

Use our development script to start services in development mode:

```powershell
.\dev.ps1
```

Or manually with Docker Compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Working on a specific service

1. Navigate to the service directory:

```bash
cd services/service-name
```

2. Install dependencies:

```bash
pnpm install
```

3. Start in development mode:

```bash
pnpm run dev
```

## API Documentation

Each service has its own API documentation available at:

- API Gateway: http://localhost:3000/docs
- Auth Service: http://localhost:3001/docs
- User Service: http://localhost:3002/docs
- (and so on for other services)

## Database Management

### Running Migrations

```bash
cd services/service-name
pnpm run migration:run
```

### Creating New Migrations

```bash
cd services/service-name
pnpm run migration:create
```

## Checkout Service

The checkout service handles the entire checkout process, from calculating order totals to creating and managing checkout sessions. It provides the following functionality:

### API Endpoints

The checkout service API runs on port 3005 and provides the following endpoints:

- `POST /api/v1/preview` - Calculate order preview with shipping and discount
- `POST /api/v1/session` - Create a checkout session
- `GET /api/v1/session?sessionId={id}` - Get a specific checkout session
- `POST /api/v1/session/complete?sessionId={id}` - Complete a checkout session
- `POST /api/v1/shipping-options` - Get available shipping options
- `POST /api/v1/validate-pincode` - Validate postal/zip code

### Database Schema

The checkout service uses a PostgreSQL database with the following schema:

```sql
CREATE TABLE "checkout_sessions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" VARCHAR NOT NULL,
  "status" "checkout_status_enum" NOT NULL DEFAULT 'PENDING',
  "cart_snapshot" JSONB NOT NULL,
  "totals" JSONB NOT NULL,
  "shipping_cost" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount_code" VARCHAR,
  "payment_intent_id" VARCHAR,
  "shipping_method" VARCHAR NOT NULL DEFAULT 'STANDARD',
  "shipping_address" JSONB,
  "billing_address" JSONB,
  "metadata" JSONB,
  "expires_at" TIMESTAMP NOT NULL,
  "completed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
)
```

### Checkout Flow

1. User adds items to cart
2. User proceeds to checkout
3. User enters shipping information
4. System calculates shipping options and costs
5. User selects shipping method
6. User enters payment information
7. System creates checkout session
8. System processes payment
9. System completes checkout session
10. User is redirected to success page

### Environment Variables

The checkout service expects the following environment variables:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=checkout_service
PORT=3005
NODE_ENV=development
```

The storefront application expects:

```
NEXT_PUBLIC_CHECKOUT_API_URL=http://localhost:3005/api/v1
```

**Important**: The API expects `userId` to be in a valid UUID format (e.g., `cc0c7021-e693-412e-9549-6c80ef327e39`).

## Deployment

### Production Deployment

```bash
./deploy.sh
```

Select option 1 for full deployment.

### Deploying Specific Services

```bash
./deploy.sh
```

Select option 5 to rebuild a specific service.

## Troubleshooting

### Viewing Logs

```bash
docker compose logs -f service-name
```

### Restarting Services

```bash
docker compose restart service-name
```

### Common Issues

- **Service Unavailable**: Check if the service container is running
- **Database Connection Issues**: Verify PostgreSQL is running and credentials are correct
- **Authentication Failures**: Check JWT secrets in environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
