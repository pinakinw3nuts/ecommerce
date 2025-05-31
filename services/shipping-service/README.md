# Shipping Service

The Shipping Service is responsible for managing shipping addresses, calculating shipping rates, and providing estimated delivery times.

## Features

- Address management (CRUD operations)
- Shipping rate calculation
- ETA calculation
- Carrier integration (FedEx, UPS)
- Rate comparison across carriers
- Shipment tracking

## API Endpoints

### Address Management

- `GET /api/v1/addresses` - List all addresses for the authenticated user
- `GET /api/v1/addresses/:id` - Get address by ID
- `POST /api/v1/addresses` - Create a new address
- `PUT /api/v1/addresses/:id` - Update an existing address
- `DELETE /api/v1/addresses/:id` - Delete an address
- `PATCH /api/v1/addresses/:id/default` - Set an address as default

### Shipping Rates

- `GET /api/v1/shipping/methods` - List all shipping methods
- `GET /api/v1/shipping/methods/available` - Get available shipping methods for a location
- `POST /api/v1/shipping/eta` - Calculate estimated time of arrival

### Carrier Integration

- `POST /api/v1/carriers/rates` - Get shipping rates from all carriers
- `POST /api/v1/carriers/rates/best` - Get best shipping rate based on criteria
- `POST /api/v1/carriers/track` - Track shipment across carriers
- `GET /api/v1/carriers/carriers` - Get available carriers

## Configuration

The service requires the following environment variables:

```
# Server configuration
NODE_ENV=development
PORT=3003
API_PREFIX=/api/v1

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=shipping_service

# JWT configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# FedEx API credentials
FEDEX_CLIENT_ID=your-fedex-client-id
FEDEX_CLIENT_SECRET=your-fedex-client-secret
FEDEX_ACCOUNT_NUMBER=your-fedex-account-number
FEDEX_METER_NUMBER=your-fedex-meter-number

# UPS API credentials
UPS_CLIENT_ID=your-ups-client-id
UPS_CLIENT_SECRET=your-ups-client-secret
UPS_ACCOUNT_NUMBER=your-ups-account-number
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Start the service: `npm run dev`

## Development

- `npm run build` - Build the service
- `npm run start` - Start the service in production mode
- `npm run dev` - Start the service in development mode
- `npm run test` - Run tests

## Carrier Integration

The service integrates with multiple shipping carriers to provide rate comparison and tracking functionality. Currently supported carriers:

- FedEx
- UPS

### Adding a New Carrier

To add a new carrier:

1. Create a new carrier service class that implements the `ICarrierService` interface
2. Add carrier configuration to the `CarrierFactory` class
3. Update environment variables with the new carrier's API credentials

### Rate Comparison

The service provides rate comparison functionality across all configured carriers. Rates can be compared based on:

- Price (cheapest)
- Time (fastest)
- Value (best combination of price and time)

## Tech Stack

- Node.js
- TypeScript
- Fastify
- TypeORM
- PostgreSQL
- Zod (for validation)
- Pino (for logging)
- Vitest (for testing)

## Path Aliases

This project uses TypeScript path aliases for cleaner imports. Instead of using relative paths like `../../../utils/logger`, you can use the following aliases:

- `@/*` - Root directory (src)
- `@config/*` - Configuration files
- `@controllers/*` - Controllers
- `@entities/*` - TypeORM entities
- `@middlewares/*` - Middleware functions
- `@routes/*` - Route definitions
- `@services/*` - Service layer
- `@utils/*` - Utility functions

Example:
```typescript
// Instead of this
import { logger } from '../../utils/logger';

// You can use this
import { logger } from '@utils/logger';
```

## Scripts

- `npm run dev` - Run the service in development mode with hot-reload
- `npm run build` - Build the TypeScript code
- `npm start` - Run the compiled service in production mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run linter

## Testing

The project uses Jest for testing. Tests are located in the `src/__tests__` directory and are organized by feature:

- `src/__tests__/shipping.test.ts` - Tests for shipping calculation endpoints
- `src/__tests__/address.test.ts` - Tests for address management endpoints
- `src/__tests__/etaCalculator.test.ts` - Tests for ETA calculation utility

To run tests:

```bash
npm test
```

## Database Migrations

To create a new migration:
```bash
npm run migration:create src/migrations/MigrationName
```

To run migrations:
```bash
npm run migration:run
```

To revert the last migration:
```bash
npm run migration:revert
```

## Docker

Build the Docker image:
```bash
docker build -t shipping-service .
```

Run the Docker container:
```bash
docker run -p 3012:3012 --env-file .env shipping-service
``` 