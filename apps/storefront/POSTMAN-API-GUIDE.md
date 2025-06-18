# Postman API Guide for E-commerce Orders API

This guide explains how to set up and test the Order API using Postman, including authentication.

## Prerequisites

1. Postman installed on your machine
2. Order Service running (port 3006)
3. Auth Service running (for obtaining tokens)
4. A user account in the system

## Step 1: Obtain Authentication Token

You're getting 401 Unauthorized errors because you need a valid JWT token. Here's how to get one:

### Option 1: Login through the API

1. Create a POST request to `http://localhost:3004/api/auth/login`
2. Set Body to raw JSON with:
   ```json
   {
     "email": "your_test_user@example.com",
     "password": "your_password"
   }
   ```
3. Send the request
4. From the response, copy the `accessToken` value

### Option 2: Extract token from browser

1. Login to the storefront app in your browser
2. Open developer tools (F12)
3. Go to Application tab > Cookies
4. Find and copy the value of the `accessToken` cookie

### Option 3: Create a test token

For testing purposes, you can also create a simple JWT token:

```javascript
// In the Order Service project:
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user-id', roles: ['user'] },
  'your-super-secret-jwt-key-min-32-chars-here', // Must match JWT_SECRET in order service .env
  { expiresIn: '1h' }
);
console.log(token);
```

## Step 2: Set up Postman for API requests

### Create a Collection

1. Create a new Postman Collection called "E-commerce API"
2. In the collection settings, go to the "Variables" tab
3. Add a variable:
   - Name: `token`
   - Initial Value: [paste your token here]
   - Current Value: [paste your token here]
4. Save the collection

### Set Collection Authorization

1. Go to the "Authorization" tab in your collection
2. Type: "Bearer Token"
3. Token: `{{token}}`

## Step 3: Create Request for Orders List

1. Create a new request in your collection
2. Set method to GET
3. URL: `http://localhost:3006/api/v1/public/orders`
4. Under "Headers" tab, ensure:
   ```
   Authorization: Bearer {{token}}
   Accept: application/json
   ```
5. Save the request
6. Send it

## Step 4: Create Request for Order Details

1. Create a new request in your collection
2. Set method to GET
3. URL: `http://localhost:3006/api/v1/public/orders/{{orderId}}`
4. Create a variable in the collection for `orderId` with a valid order ID
5. Under "Headers" tab, ensure:
   ```
   Authorization: Bearer {{token}}
   Accept: application/json
   ```
6. Save the request
7. Send it

## Troubleshooting Authentication Issues

If you're still getting 401 errors:

### 1. Check token validity

Make sure your token:
- Is not expired
- Has the required claims (user ID)
- Is correctly signed with the same JWT_SECRET as the Order Service

### 2. Check token format

- The token should be passed as: `Bearer eyJhbGciOiJIUzI...`
- Ensure there's a space between "Bearer" and the token value

### 3. Debug the token

You can debug your JWT token at [jwt.io](https://jwt.io/) to verify its contents.

### 4. Check order service logs

Look for specific error messages in the order service logs. Common issues include:
- Token expired
- Invalid signature
- Missing required claims

## Alternative: Testing through API Gateway

Instead of calling the Order Service directly, you can also test through the API Gateway:

1. URL: `http://localhost:3004/api/v1/orders`
2. Same authentication method applies

This is closer to how the frontend application accesses the API.

## Creating Test Orders via API

If you need to create test orders to verify the listing endpoint:

```
POST http://localhost:3006/api/v1/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": "test-user-id", 
  "items": [
    {
      "productId": "product-123",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "country": "US",
    "postalCode": "12345"
  }
}
``` 