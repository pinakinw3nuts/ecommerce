# Order Service Setup Instructions

This document provides instructions for setting up and running the Order Service, which has been restructured to follow the same patterns as the Checkout and Cart services.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository or navigate to the order service directory:
   ```bash
   cd services/order-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file to set up your configuration:
   ```
   # Server Configuration
   PORT=3006
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=order_db
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars-here
   
   # CORS Configuration
   CORS_ORIGINS=http://localhost:3000,http://localhost:3100
   
   # API Gateway Configuration (optional)
   API_GATEWAY_URL=http://localhost:3000
   ```

5. Set up the JWT secret:
   ```bash
   npm run setup-jwt
   ```

## Database Setup

1. Make sure PostgreSQL is running and accessible.

2. Create the database:
   ```sql
   CREATE DATABASE order_db;
   ```

3. The service will automatically create tables on startup in development mode.

## Running the Service

1. Start the service in development mode:
   ```bash
   npm run dev
   ```

2. Build and run for production:
   ```bash
   npm run build
   npm start
   ```

## Testing

1. Run the authentication test:
   ```bash
   npm run test-auth
   ```

2. Run the regular test suite:
   ```bash
   npm test
   ```

3. Import the Postman collection from `POSTMAN-TESTS.md` to test the API endpoints manually.

## Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t order-service .
   ```

2. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Accessing the API

- API Documentation: http://localhost:3006/documentation
- Health Check: http://localhost:3006/health

## Route Structure

The Order Service has been reorganized with three types of routes:

1. **Public Routes** (no auth required):
   - `GET /api/v1/public/orders`
   - `GET /api/v1/public/orders/:id`
   - `POST /api/v1/checkout/orders`

2. **Protected Routes** (user auth required):
   - `GET /api/v1/orders`
   - `GET /api/v1/orders/:id`
   - `POST /api/v1/orders`

3. **Admin Routes** (admin auth required):
   - `GET /api/v1/admin/orders`
   - `POST /api/v1/admin/orders/:id/notes`
   - `PATCH /api/v1/admin/orders/:id/status`

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running
- Verify connection parameters in `.env`
- Run `npm run dev -- --loglevel=debug` for verbose logging

### Authentication Issues

- Make sure JWT_SECRET is set correctly
- Verify token is properly formed with user ID and roles
- Check the expiry time on tokens

### API Integration Issues

- Ensure CORS settings match your frontend application
- Check API Gateway configuration if applicable

## Integration with Other Services

This service follows the same patterns as the Checkout and Cart services:

- JWT authentication with `@fastify/jwt`
- Fastify framework with routes organized by authentication level
- TypeORM with PostgreSQL and connection pooling
- Flexible CORS configuration
- Health check endpoint for monitoring
- Swagger documentation 