# API Gateway Service

A modern, TypeScript-based API Gateway service for the e-commerce microservices platform. Built with Fastify for high performance and reliability.

## Features

- 🚀 High-performance request forwarding with [undici](https://github.com/nodejs/undici)
- 🔒 Built-in security with helmet and CORS
- 🚦 Rate limiting with Redis support
- 📝 Structured logging with Pino
- 🏥 Health check endpoints
- 🔍 Request tracing with request IDs
- ⏱️ Response time tracking
- 🔄 Graceful shutdown handling

## Prerequisites

- Node.js >= 18.0.0
- pnpm
- Docker and Docker Compose
- Redis (optional, for rate limiting)

## Quick Start

### Using Docker

1. Build and start the service:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f api-gateway
```

3. Stop the service:
```bash
docker-compose down
```

### Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
pnpm run dev
```

4. Build for production:
```bash
pnpm run build
pnpm start
```

## Configuration

Environment variables:

```env
# Server
PORT=3000
HOST=0.0.0.0

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000

# Microservices
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3003
```

## API Endpoints

### Health Check

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health metrics
curl http://localhost:3000/health/details
```

Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "service": "api-gateway",
  "memory": {
    "heapUsed": 50,
    "heapTotal": 100,
    "external": 10,
    "rss": 150
  },
  "version": "1.0.0"
}
```

### Service Routes

The gateway forwards requests to the following services:

- Authentication Service: `/api/auth/*`
- User Service: `/api/users/*`
- Product Service: `/api/products/*`

Example requests:

```bash
# Auth service
curl http://localhost:3000/api/auth/login

# User service
curl http://localhost:3000/api/users/profile

# Product service
curl http://localhost:3000/api/products/list
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm run test:watch
```

### Manual Testing

1. Test health endpoint:
```bash
curl http://localhost:3000/health
```

2. Test rate limiting:
```bash
# Send multiple requests quickly
for i in {1..150}; do 
  curl -I http://localhost:3000/api/products/list
done
```

3. Test request tracing:
```bash
curl -H "x-request-id: test-123" http://localhost:3000/api/users/profile
```

## Monitoring

The service exposes several metrics and headers for monitoring:

- `x-response-time`: Response time in milliseconds
- `x-request-id`: Unique request identifier
- Health metrics at `/health/details`

## Development

### Available Scripts

- `pnpm run dev`: Start development server with hot reload
- `pnpm run build`: Build for production
- `pnpm start`: Start production server
- `pnpm run lint`: Run ESLint
- `pnpm run lint:fix`: Fix linting issues
- `pnpm test`: Run tests
- `pnpm run typecheck`: Check types

### Directory Structure

```
src/
├── config/         # Configuration and environment variables
├── controllers/    # Request handlers
├── middlewares/    # Custom middlewares
├── routes/         # Route definitions
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For support, please open an issue in the repository. 