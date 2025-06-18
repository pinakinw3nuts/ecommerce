# Using Real API Data for Orders

This guide explains how to use real API data for the orders functionality instead of mock data.

## Overview

By default, the storefront application uses mock data for orders when the API is not available or returns errors. This is helpful for development, but you may want to use real data from the Order Service.

## Prerequisites

1. The Order Service must be set up and running on port 3006
2. The API Gateway must be set up and running on port 3004
3. Both services must be configured properly to communicate with each other

## Starting the Required Services

We've created a helper script to start both services:

```bash
npm run start:api-services
```

This script will:
1. Start the Order Service
2. Wait for it to initialize
3. Start the API Gateway
4. Keep both services running until you press Ctrl+C

## Running the Storefront with Real API Data

To start the storefront application with mock data disabled:

```bash
npm run dev:real-api
```

This sets the `DISABLE_MOCK_DATA=true` environment variable, which forces the application to use the real API data.

## Testing the Integration

1. Navigate to http://localhost:3100/login and log in with your credentials
2. Go to http://localhost:3100/account/orders to see your orders
3. Click on an order to see its details

If the API services are running correctly, you should see real order data from the database.

## Troubleshooting

If you're still seeing mock data, check the following:

1. **API Services Running**: Ensure both the Order Service and API Gateway are running
   - Order Service: Should be on port 3006
   - API Gateway: Should be on port 3004

2. **Browser Console**: Check for any errors in the browser console
   - Look for API request failures or 404 errors

3. **Authentication**: Make sure you're properly logged in
   - The frontend must pass a valid JWT token to the API

4. **API Connection**: Check the network tab in developer tools
   - Verify requests are being made to `/api/v1/orders`
   - Verify the responses have status code 200

5. **Database**: Verify the Order Service database has data
   - If no orders exist, nothing will be displayed

## Manual Override

If needed, you can manually enable or disable mock data:

```javascript
// To force use of mock data
localStorage.setItem('USE_MOCK_DATA', 'true');

// To force use of real API data
localStorage.setItem('DISABLE_MOCK_DATA', 'true');
```

Reload the page after setting these values.

## Creating Test Data

If you need to create test orders to see data:

1. Complete a checkout flow to create a real order
2. Or use the API directly (requires authentication):

```bash
curl -X POST http://localhost:3004/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "a-product-id",
        "quantity": 1,
        "price": 99.99
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "country": "US",
      "postalCode": "12345"
    }
  }'
``` 