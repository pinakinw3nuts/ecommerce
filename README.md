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
