# Auth Service

A microservice responsible for authentication and authorization in the e-commerce platform. This service handles user registration, authentication, and token management using JWT.

## Features

- User registration and login
- JWT-based authentication
- Google OAuth integration
- Password reset functionality
- Token refresh mechanism
- Role-based access control
- OpenAPI/Swagger documentation
- Docker containerization

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Redis (for token management)

## Getting Started

### Environment Setup

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=auth_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Running with Docker

1. Build and start the services:
```bash
docker-compose up --build
```

2. The service will be available at `http://localhost:3001`

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Routes

### Authentication Routes

- `POST /api/auth/signup`
  - Register a new user
  - Body: `{ email: string, password: string, name: string }`

- `POST /api/auth/login`
  - Authenticate user
  - Body: `{ email: string, password: string }`

- `POST /api/auth/google-login`
  - Authenticate with Google
  - Body: `{ token: string }`

- `POST /api/auth/refresh-token`
  - Refresh access token
  - Body: `{ refreshToken: string }`

### User Routes

- `GET /api/users/me`
  - Get current user profile
  - Requires: Authentication

- `PUT /api/users/update-password`
  - Update user password
  - Requires: Authentication
  - Body: `{ currentPassword: string, newPassword: string }`

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## API Documentation

Once the service is running, you can access the Swagger documentation at:
- `http://localhost:3001/documentation`

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typeorm` - Run TypeORM CLI commands

### Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── entities/       # TypeORM entities
├── middlewares/    # Custom middlewares
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── index.ts        # App initialization
└── server.ts       # Server entry point
```

## Error Handling

The service uses standardized error responses:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

## Security

- Password hashing using bcrypt
- JWT token authentication
- CORS protection
- Rate limiting
- Input validation using Zod
- SQL injection protection
- XSS protection

## Contributing

1. Create a new branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

ISC 