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

### Authentication
- `POST /auth/register` - Register a new user
  - Body: `{ email: string, password: string, firstName: string, lastName: string }`
- `POST /auth/login` - Login user
  - Body: `{ email: string, password: string }`

### Profile Management
- `GET /me` - Get current user profile
  - Headers: `Authorization: Bearer <token>`
- `PATCH /update-profile` - Update user profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ firstName?: string, lastName?: string, email?: string }`

### Address Management
- `GET /addresses` - List user addresses
  - Headers: `Authorization: Bearer <token>`
- `POST /addresses` - Add new address
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ street: string, city: string, state: string, country: string, postalCode: string }`
- `PUT /addresses/:id` - Update address
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ street?: string, city?: string, state?: string, country?: string, postalCode?: string }`
- `DELETE /addresses/:id` - Delete address
  - Headers: `Authorization: Bearer <token>`

### Loyalty Program
- `POST /enroll-loyalty` - Enroll in loyalty program
  - Headers: `Authorization: Bearer <token>`

### Role Management
- `PATCH /change-role` - Change user role (Admin only)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ userId: string, role: "USER" | "ADMIN" }`

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