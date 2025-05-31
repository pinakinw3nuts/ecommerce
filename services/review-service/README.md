# Review Service

A microservice for managing product reviews in an e-commerce platform.

## Features

- Create, read, update, and delete product reviews
- Review moderation (admin-only)
- Review statistics and aggregation
- JWT authentication
- Role-based access control
- Swagger API documentation

## Tech Stack

- Node.js
- TypeScript
- Fastify
- TypeORM
- PostgreSQL
- Zod (validation)
- Pino (logging)
- Vitest (testing)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
NODE_ENV=development
PORT=3014
HOST=localhost
LOG_LEVEL=debug
VERSION=1.0.0

# Database configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/reviews

# Auth configuration
JWT_SECRET=your_jwt_secret_key_here

# CORS configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run database migrations
npm run migration:run

# Start the server
npm start
```

### Development

```bash
# Start in development mode with hot-reloading
npm run dev

# Lint the code
npm run lint

# Format the code
npm run format

# Run tests
npm test
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3014/documentation
```

## Docker

The service can be run in Docker:

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
``` 