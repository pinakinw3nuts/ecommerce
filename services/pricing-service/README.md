# Pricing Service

Microservice for managing product pricing, price lists, and currency conversion.

## Features

- Price list management with customer group support
- Tiered pricing based on quantity
- Currency conversion with automatic rate updates
- Sale price scheduling
- Admin-only and public API endpoints
- Swagger documentation

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

### Quick Start with Docker

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ecommerce/services/pricing-service
   ```

2. **Build and run with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Build the pricing service Docker image
   - Start the pricing service on port 3010
   - Start a PostgreSQL database
   - Create a persistent volume for database data

3. **Access the service**

   - API: http://localhost:3010
   - Swagger documentation: http://localhost:3010/documentation

4. **View logs**

   ```bash
   docker-compose logs -f
   ```

5. **Stop the service**

   ```bash
   docker-compose down
   ```

6. **Remove containers and volumes**

   ```bash
   docker-compose down -v
   ```

### Docker Environment Variables

You can customize the service by modifying the environment variables in the `docker-compose.yml` file:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | The port the service listens on | 3010 |
| HOST | The host to bind to | 0.0.0.0 |
| NODE_ENV | Environment (development/production) | production |
| DATABASE_URL | PostgreSQL connection string | postgres://postgres:postgres@postgres:5432/pricing |
| JWT_SECRET | Secret for JWT authentication | your_jwt_secret_change_in_production |
| DEFAULT_CURRENCY | Base currency code | USD |

### Building the Docker Image Manually

```bash
docker build -t pricing-service .
```

### Running the Container Manually

```bash
docker run -p 3010:3010 \
  -e DATABASE_URL=postgres://postgres:postgres@postgres:5432/pricing \
  -e JWT_SECRET=your_jwt_secret \
  --name pricing-service \
  pricing-service
```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env` file in the root directory:

```
NODE_ENV=development
PORT=3010
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pricing
JWT_SECRET=dev_secret_change_me
```

### Run in Development Mode

```bash
npm run dev
```

### Build and Run for Production

```bash
npm run build
npm start
```

## API Documentation

When the service is running, visit `/documentation` for the Swagger UI interface that shows all available endpoints.

## Testing

Run the tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Architecture

The pricing service is built with:

- TypeScript for type safety
- Fastify for high-performance API
- TypeORM for database interactions
- Zod for validation
- Vitest for testing

### Directory Structure

```
pricing-service/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # API controllers
│   ├── entities/       # TypeORM entities
│   ├── middlewares/    # Middleware functions
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── app.ts          # Application setup
│   └── server.ts       # Server entry point
├── tests/              # Test files
├── .env                # Environment variables
└── package.json        # Dependencies and scripts
```

## License

This project is licensed under the MIT License. 