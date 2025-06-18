# Order Service - Checkout Integration Guide

This document outlines how the Order Service integrates with the Checkout Service to create orders from completed checkout sessions.

## Order Checkout Flow

1. **Checkout Session Creation** (Checkout Service)
   - User adds items to their cart
   - Storefront initiates checkout process
   - Checkout service creates a session with a snapshot of the cart

2. **Payment Processing** (Payment Service)
   - User provides payment details
   - Payment is processed by payment service
   - Returns a payment intent ID

3. **Checkout Completion** (Checkout Service)
   - Checkout service marks the session as COMPLETED
   - Session contains the final cart snapshot and address details

4. **Order Creation** (Order Service)
   - Storefront calls the Order Service with the checkout session ID
   - Order Service retrieves the session data from Checkout Service
   - Order is created from the checkout session data

## API Endpoints

### Create Order from Checkout

**Endpoint:** `POST /api/v1/orders/checkout`

**Request Body:**
```json
{
  "checkoutSessionId": "uuid-of-checkout-session"
}
```

**Response:**
```json
{
  "id": "order-uuid",
  "status": "PENDING",
  "totalAmount": 123.45,
  "items": [
    {
      "id": "item-uuid",
      "productId": "product-uuid",
      "price": 45.99,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "country": "US",
    "postalCode": "12345"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "country": "US",
    "postalCode": "12345"
  },
  "createdAt": "2023-11-01T12:00:00Z"
}
```

## Integration Requirements

### Environment Variables

The Order Service needs the following environment variable to communicate with the Checkout Service:

```
CHECKOUT_SERVICE_URL=http://localhost:3005
```

### Error Handling

The service handles these error cases:
- Checkout session not found (404)
- Session not in COMPLETED status (400)
- Missing cart items in session (400)
- General API communication errors (500)

## Sequence Diagram

```
sequenceDiagram
    Storefront->>Order: POST /api/v1/orders/checkout {sessionId}
    Order->>Checkout: GET /api/v1/checkout/session/{sessionId}
    Checkout-->>Order: Session data
    Order->>Order: Validate session (COMPLETED status)
    Order->>Order: Create order from session data
    Order-->>Storefront: Order details
    Order->>Notification: Send order confirmation
```

## Troubleshooting

Common issues and their solutions:

1. **Cannot reach checkout service**
   - Check if CHECKOUT_SERVICE_URL is correctly configured
   - Ensure the checkout service is running

2. **Session not found**
   - Verify the checkout session ID is correct
   - Check if the session has expired

3. **Cannot create order**
   - Ensure the session is in COMPLETED status
   - Check if cart items exist in the session

## Development Notes

When developing locally:
1. Ensure both order-service and checkout-service are running
2. Set up proper environment variables
3. Use the checkout integration tests to verify the flow works 