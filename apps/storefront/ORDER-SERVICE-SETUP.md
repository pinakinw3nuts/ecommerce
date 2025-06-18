# Order Service Setup & Authentication Guide

This document explains how to set up and test the Order Service API with proper authentication.

## Understanding the 401 Error

The 401 Unauthorized errors occur because:

1. The Order Service requires a valid JWT token in the `Authorization` header
2. Your Postman request is missing this token or using an invalid token
3. The JWT secret key in the service's .env file must match the one used for token generation

## Quick Setup

We've created several tools to help you get started quickly:

```bash
# 1. Set up JWT authentication for the Order Service
cd services/order-service
node setup-jwt.js

# 2. Start the Order Service
cd ../../apps/storefront
npm run start:order-service

# 3. Test the API with the generated token
# Use token from setup-jwt.js output
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3006/api/v1/public/orders
```

## Detailed Solution

### 1. Environment Setup

We've created a setup script that:
- Creates/updates the `.env` file with a proper `JWT_SECRET` if missing
- Generates a test JWT token that will work with your configuration
- Provides test commands

```bash
cd services/order-service
node setup-jwt.js
```

### 2. Testing with Postman

We've provided a detailed Postman guide:
- How to obtain a valid JWT token
- Setting up authentication headers
- Creating test collections
- Example API requests

See `apps/storefront/POSTMAN-API-GUIDE.md` for full instructions.

### 3. Debugging Tools

Several debugging tools are available:

- `generate-test-token.js`: Creates a valid JWT token for testing
- `debug-jwt.js`: Validates tokens against your current configuration
- `create-test-order.js`: Creates test orders in the database

```bash
# Debug a token
node debug-jwt.js "Bearer YOUR_TOKEN_HERE"

# Create test data
node create-test-order.js
```

### 4. Understanding the Authentication Flow

The Order Service uses JWT authentication:

1. Client requests include a JWT token in the Authorization header
2. Service verifies the token using the JWT_SECRET from the .env file
3. If valid, it extracts the user ID from the token payload
4. It then retrieves orders for that specific user
5. If invalid, it returns a 401 Unauthorized response

### 5. Starting the Service

We've added a convenient script to start the Order Service:

```bash
cd apps/storefront
npm run start:order-service
```

This script:
- Checks for proper configuration
- Installs dependencies if needed
- Starts the service with appropriate options
- Shows color-coded logs for easy debugging

## Integration with Frontend

The frontend application already has the necessary code to:
1. Extract the authentication token from cookies after user login
2. Include it in API requests to the Order Service
3. Fall back to mock data if authentication fails

You can test with the frontend by:
```bash
npm run dev:real-api
```

## Common Issues and Solutions

### 1. Missing .env File

If your Order Service doesn't have an .env file with JWT_SECRET:
```bash
cd services/order-service
node setup-jwt.js
```

### 2. Invalid Token

If your token is invalid or expired, generate a new one:
```bash
cd services/order-service
node generate-test-token.js
```

### 3. No Orders Found

If you're authenticated but no orders appear, create test data:
```bash
cd services/order-service
node create-test-order.js
```

### 4. Forgot Token Format

Always include "Bearer " before your token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

## Conclusion

By following these steps and using the provided tools, you should be able to successfully authenticate with the Order Service API and retrieve order data without 401 errors. 