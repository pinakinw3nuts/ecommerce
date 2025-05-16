# User Service

The User Service is a microservice component of the e-commerce platform responsible for managing user accounts, authentication, profile management, addresses, and loyalty program enrollment.

## Features

- User authentication and authorization
- Profile management
- Address management
- Loyalty program enrollment
- Role-based access control

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- PostgreSQL (if running locally)

## Quick Start with Docker

1. Build and start the service:
```bash
docker-compose up --build
```

2. The service will be available at `http://localhost:3000`

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npm run migration:run
```

4. Start development server:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### GET /api/v1/me
Get current user profile

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "status": "ACTIVE",
  "preferences": {
    "newsletter": boolean,
    "marketing": boolean,
    "theme": "light" | "dark",
    "language": "string"
  }
}
```

### POST /api/v1/users
Create a new user

**Request**
- Body: `{ email: string, password: string, name: string }`

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

### PATCH /api/v1/me
Update current user profile

**Request**
- Body: `{ name?: string, email?: string }`

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER"
}
```

### POST /api/v1/me/addresses
Add a new address

**Request**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "isDefault": true
}
```

**Response**
```json
{
  "id": "uuid",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "isDefault": true
}
```

### GET /api/v1/me/addresses
List user addresses

**Response**
```json
[
  {
    "id": "uuid",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "isDefault": true
  }
]
```

### PATCH /api/v1/me/preferences
Update user preferences

**Request**
```json
{
  "newsletter": true,
  "marketing": false,
  "theme": "dark",
  "language": "en"
}
```

**Response**
```json
{
  "newsletter": true,
  "marketing": false,
  "theme": "dark",
  "language": "en"
}
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=user_service

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
```

## Docker Configuration

The service includes a multi-stage Dockerfile optimized for production and a docker-compose.yml for local development.

### Build and run with Docker:

```bash
# Build image
docker build -t user-service .

# Run container
docker run -p 3000:3000 user-service
```

### Run with Docker Compose:

```bash
# Development mode
docker-compose up

# Production mode
docker-compose -f docker-compose.prod.yml up
```

## Project Structure

```
services/user-service/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── entities/       # TypeORM entities
│   ├── middlewares/    # Custom middlewares
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── tests/              # Test files
├── .env.example        # Example environment variables
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
└── package.json        # Project dependencies
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is proprietary software. All rights reserved. 