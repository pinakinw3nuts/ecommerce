# Inventory Service

A microservice for managing inventory in the e-commerce platform.

## Features

- Inventory management (create, read, update)
- Stock level tracking
- Low stock alerts
- Inventory movement history
- Location management
- Role-based access control

## API Endpoints

### Inventory Endpoints

- `GET /inventory/:sku` - Get inventory by SKU
- `POST /inventory` - Create new inventory item (protected)
- `PUT /inventory/:sku` - Update inventory by SKU (protected)
- `POST /inventory/bulk-sync` - Bulk sync inventory items (protected)

### Alert Endpoints

- `GET /alerts/low-stock` - Get low stock items (admin only)

### Health Endpoints

- `GET /health` - Check service health status and database connection

## Setup

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3009
   
   # CORS
   CORS_ORIGINS=http://localhost:3000,https://admin.example.com
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=inventory_service
   
   # Authentication
   AUTH_ENABLED=true
   JWT_SECRET=inventory-service-secret-key-change-in-production
   
   # Logging
   LOG_LEVEL=info
   
   # Alerts
   ALERT_STOCK_THRESHOLD=5
   ```

3. Set up the database:
   ```
   npm run setup-db
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Docker Development

1. Using Docker Compose (recommended for development):
   ```
   docker-compose up
   ```
   This will start both the inventory service and a PostgreSQL database.

2. Access the service at http://localhost:3009

### Docker Production

1. Build the production Docker image:
   ```
   docker build -f Dockerfile.prod -t inventory-service:prod .
   ```

2. Run the production container:
   ```
   docker run -p 3009:3009 \
     -e DB_HOST=your-db-host \
     -e DB_PORT=5432 \
     -e DB_USERNAME=postgres \
     -e DB_PASSWORD=your-password \
     -e DB_DATABASE=inventory_service \
     -e JWT_SECRET=your-secret-key \
     inventory-service:prod
   ```

## Docker Configuration

The service includes several Docker configurations:

- `Dockerfile` - Development Docker configuration
- `Dockerfile.prod` - Production-optimized Docker configuration with multi-stage build
- `docker-compose.yml` - Development setup with PostgreSQL database
- `.dockerignore` - Excludes unnecessary files from Docker builds

### Environment Variables

When running with Docker, you can configure the service using these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/production) | development |
| PORT | Port to listen on | 3009 |
| DB_HOST | Database host | postgres |
| DB_PORT | Database port | 5432 |
| DB_USERNAME | Database username | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_DATABASE | Database name | inventory_service |
| JWT_SECRET | Secret for JWT tokens | inventory-service-secret |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000,http://localhost:3001 |
| LOG_LEVEL | Logging level | info |
| ALERT_STOCK_THRESHOLD | Default threshold for low stock alerts | 5 |

## API Documentation

API documentation is available at `/documentation` when the server is running.

## Security

The service includes:
- JWT authentication
- Role-based access control
- CORS protection
- Security headers via Helmet

## Development

### TypeScript Configuration

The project uses TypeScript with the following configuration:
- Target: ES2020
- Strict type checking enabled
- Path aliases for cleaner imports
- Source maps for debugging

### Path Aliases

Use these path aliases for cleaner imports:

```typescript
// Instead of relative imports
import { something } from '../../../../utils/helpers';

// Use path aliases
import { something } from '@utils/helpers';
```

Available path aliases:
- `@/*` - src directory
- `@config/*` - Configuration files
- `@controllers/*` - Controllers
- `@entities/*` - Database entities
- `@middlewares/*` - Middleware functions
- `@routes/*` - Route definitions
- `@services/*` - Service classes
- `@utils/*` - Utility functions

### Code Quality Tools

The project includes several tools to maintain code quality:

#### ESLint
Run linting checks:
```
npm run lint
```

Fix linting issues automatically:
```
npm run lint:fix
```

#### Prettier
The code style is enforced using Prettier. Configuration is in `.prettierrc`.

## Scripts

- `npm run build` - Build the TypeScript code
- `npm run start` - Start the production server
- `npm run dev` - Start the development server with hot reloading
- `npm run setup-db` - Set up the database
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Tests

### Inventory Service Tests

#### Stock Adjustment Tests

Tests for stock adjustments functionality:
- Stock in (adding inventory)
- Stock out (removing inventory)
- Adjustments (correcting inventory)
- Error handling and validation

Run with:
```bash
npm test src/services/__tests__/inventory.service.stock-adjustment.spec.ts
```

#### Bulk Sync Tests

Tests for bulk inventory synchronization:
- Processing multiple inventory items
- Handling conflicts
- Validation and error handling

Run with:
```bash
npm test src/services/__tests__/inventory.service.bulk-sync.spec.ts
```

### Alert Service Tests

Tests for the low stock alert functionality:
- Detecting low stock conditions
- Sending notifications
- Threshold configuration

Run with:
```bash
npm test src/services/__tests__/alert.service.low-stock.spec.ts
```

### Controller Tests

#### Alert Controller Tests

Tests for the alert controller endpoints:
- Role-based access control for the low stock alerts endpoint
- Filtering alerts by location
- Error handling and response formatting

Run with:
```bash
npm test src/controllers/__tests__/alert.controller.spec.ts
```

#### Health Controller Tests

Tests for the health check endpoint:
- Successful database connection check
- Error handling when database connection fails
- Automatic database initialization when not already initialized

Run with:
```bash
npm test src/controllers/__tests__/health.controller.spec.ts
```

### Route Tests

#### Health Route Tests

Tests for the health route endpoint:
- Integration test for successful health check
- Database connection failure handling
- Database initialization when not already connected

Run with:
```bash
npm test src/routes/__tests__/health.routes.spec.ts
```

### Running All Tests

```bash
npm test
```

For watching mode during development:
```bash
npm run test:watch
```

For test coverage:
```bash
npm run test:coverage
```