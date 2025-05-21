# Admin Service

Admin service for the e-commerce backend, built with TypeScript, Fastify, TypeORM, and PostgreSQL.

## Docker Setup

### Using Docker Compose (Recommended)

The easiest way to run the admin service is with Docker Compose:

```bash
# Build and start the service with PostgreSQL
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop the services
docker-compose down
```

### Using Docker Directly

You can also build and run the Docker image directly:

```bash
# Build the Docker image
docker build -t admin-service .

# Run the container
docker run -p 3007:3007 \
  -e DATABASE_URL=postgresql://postgres:admin@123@localhost:5432/ecom \
  -e JWT_SECRET=dev-secret-key-for-testing-only \
  admin-service
```

## Development Setup

To run the service locally for development:

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build the service
npm run build

# Start in production mode
npm run start
```

## Environment Variables

- `PORT`: The port to run the service on (default: 3007)
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development, production, test)
- `JWT_SECRET`: Secret key for JWT tokens

## API Documentation

Once the service is running, you can access the API documentation at:
http://localhost:3007/documentation

## Features

- Admin dashboard with key metrics and statistics
- User management (listing, banning, suspension)
- Activity logging for audit trails
- Authentication and authorization for admin users
- OpenAPI documentation

## Tech Stack

- Fastify - Web framework
- TypeScript - Language
- TypeORM - Database ORM
- PostgreSQL - Database
- Zod - Validation
- Pino - Logging

## Available Endpoints

- `/api/admin/dashboard` - Dashboard statistics and metrics
- `/api/admin/users`