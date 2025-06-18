# E-commerce Microservices Integration

This document outlines the integration between the cart, checkout, and order microservices through the API gateway.

## Overview

The API gateway serves as the central entry point for all client requests and handles routing to the appropriate microservices. For the e-commerce flow, we've integrated three key services:

1. **Cart Service** - Manages shopping carts for both guest and authenticated users
2. **Checkout Service** - Handles checkout process, shipping calculations, and payment processing
3. **Order Service** - Manages order creation and lifecycle

## API Endpoints

### Cart Service

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cart` | GET | Get user's current cart |
| `/api/v1/cart/items` | POST | Add item to cart |
| `/api/v1/cart/items/:itemId` | PUT | Update cart item |
| `/api/v1/cart/items/:itemId` | DELETE | Remove item from cart |
| `/api/v1/cart/:cartId/checkout` | PUT | Mark cart as checked out |

### Checkout Service

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/checkout/preview` | POST | Get order preview with calculated totals |
| `/api/v1/checkout/delivery-estimate` | POST | Get estimated delivery dates |
| `/api/v1/checkout/validate-pincode` | POST | Validate postal/zip code |
| `/api/v1/checkout/session` | POST | Create checkout session |
| `/api/v1/checkout/shipping-methods` | GET | Get available shipping methods |

### Order Service

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/orders` | GET | Get user's orders |
| `/api/v1/orders` | POST | Create a new order |
| `/api/v1/orders/:orderId` | GET | Get order by ID |

### Integrated Endpoints

We've also created integrated endpoints that coordinate between multiple services:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/checkout/cart-summary` | GET | Get cart with available shipping methods |
| `/api/v1/checkout/complete` | POST | Complete checkout flow (cart → checkout → order) |

## Authentication

- **Guest users** must provide an `x-device-id` header for cart operations
- **Authenticated users** must include a valid JWT token in the `Authorization` header
- The checkout completion process requires authentication

## Data Flow

### Checkout Flow

1. User adds items to cart (Cart Service)
2. User requests checkout preview (Checkout Service)
3. User selects shipping method and provides address (Client)
4. User completes checkout (Integrated flow):
   - Cart is validated (Cart Service)
   - Checkout session is created (Checkout Service)
   - Order is created (Order Service)
   - Cart is marked as checked out (Cart Service)

## Error Handling

- Each service handles its own domain-specific errors
- The API gateway provides consistent error responses to clients
- Timeout configurations are set per service based on expected response times

## Deployment

All services are containerized and can be deployed independently. The API gateway is configured to route to the appropriate service URLs based on environment variables.

## Development

To run the integrated services locally:

```bash
# Start all services
npm run dev:all

# Start specific services
npm run dev:cart
npm run dev:checkout
npm run dev:order
npm run dev:gateway
```

## Testing

Each service has its own test suite. Integration tests for the complete flow are available in the API gateway project. 