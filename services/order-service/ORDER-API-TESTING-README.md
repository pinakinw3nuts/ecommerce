# Order API Testing Guide

This directory contains several tools to help you test the Order API. These scripts will help you debug authentication issues and test the API endpoints.

## Quick Start

To quickly set up and test the Order API:

```bash
# Setup environment and generate test token
node setup-jwt.js

# Create a test order
node create-test-order.js

# Test the API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3006/api/v1/public/orders
```

## Available Tools

### 1. `setup-jwt.js`

**Purpose:** Complete setup for JWT authentication
- Creates/updates .env file with JWT_SECRET if needed
- Installs required dependencies
- Generates a test token
- Provides test commands

```bash
node setup-jwt.js
```

### 2. `generate-test-token.js`

**Purpose:** Generates a test JWT token for API testing
- Creates a token with test user ID
- Sets proper expiration
- Uses JWT_SECRET from .env file

```bash
node generate-test-token.js
```

### 3. `debug-jwt.js`

**Purpose:** Debugs issues with JWT token verification
- Validates token against your JWT_SECRET
- Shows detailed information about the token
- Helps diagnose common authentication problems

```bash
node debug-jwt.js "Bearer YOUR_TOKEN"
```

### 4. `create-test-order.js`

**Purpose:** Creates a test order in the database
- Adds an order for the specified user ID
- Creates order items
- Provides details for testing

```bash
# Create order for default test user
node create-test-order.js

# Create order for specific user ID
node create-test-order.js your-user-id
```

## Authentication Issues

If you're getting 401 Unauthorized errors:

1. **Check your JWT configuration:**
   - Make sure JWT_SECRET in .env file is correct
   - Ensure token is properly formatted with "Bearer " prefix
   - Verify token has not expired

2. **Use the debug-jwt.js tool:**
   - This will validate your token against the current JWT_SECRET
   - It will show detailed information about any issues

3. **Examine token payload:**
   - Token must include a user ID in the "id" field
   - This ID is used to find the user's orders

## API Endpoints

Once authentication is working, you can test these endpoints:

### Order List
```
GET http://localhost:3006/api/v1/public/orders
Authorization: Bearer YOUR_TOKEN
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by order status
- `dateFrom`: Filter by start date
- `dateTo`: Filter by end date

### Order Details
```
GET http://localhost:3006/api/v1/public/orders/:orderId
Authorization: Bearer YOUR_TOKEN
```

## Postman Setup

For detailed instructions on setting up Postman for API testing:

- See the [POSTMAN-API-GUIDE.md](../../apps/storefront/POSTMAN-API-GUIDE.md) file

## Troubleshooting

For detailed troubleshooting steps and solutions:

- See the [API-AUTH-FIX.md](API-AUTH-FIX.md) file

## Integration with Frontend

The frontend application integrates with the Order API through:

1. **API Gateway** - Routes requests to the Order Service
2. **Auth Context** - Provides authentication token
3. **Orders Service** - Handles API communication with error handling

If the API is unavailable, the frontend falls back to mock data. 