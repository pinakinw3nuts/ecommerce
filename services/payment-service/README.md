# Payment Service

## Overview

The Payment Service is a microservice responsible for processing payments, managing payment methods, and handling refunds in the e-commerce platform. It integrates with payment providers like Stripe to facilitate secure payment processing.

## Features

- Process payments through multiple payment providers
- Store and manage payment methods
- Handle payment status updates
- Process refunds
- Receive and handle payment webhooks
- Comprehensive API documentation with Swagger UI

## Architecture

The Payment Service is built using:

- **Fastify** - High-performance web framework
- **TypeORM** - ORM for database interactions
- **PostgreSQL** - Relational database for storing payment data
- **Stripe** - Payment processor integration
- **Zod** - Validation library
- **Pino** - Logging library

### Entity Relationships

- **Payment** - Represents a payment transaction
- **PaymentMethod** - Represents a stored payment method
- **Refund** - Represents a refund transaction linked to a payment

## Flow Diagram

### Payment Processing Flow

```
┌──────────┐     ┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│          │     │                │     │                 │     │              │
│  Client  │────▶│  API Gateway   │────▶│  Payment Service │────▶│  Stripe API  │
│          │     │                │     │                 │     │              │
└──────────┘     └────────────────┘     └─────────────────┘     └──────────────┘
                                               │  ▲
                                               │  │
                                               ▼  │
                                        ┌─────────────────┐      ┌──────────────┐
                                        │                 │      │              │
                                        │     Database    │◀────▶│ Order Service│
                                        │                 │      │              │
                                        └─────────────────┘      └──────────────┘
```

### Webhook Handling Flow

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│              │     │                 │     │                 │
│  Stripe API  │────▶│  Payment Service │────▶│     Database    │
│              │     │                 │     │                 │
└──────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │                  │
                      │  Order Service   │
                      │                  │
                      └──────────────────┘
```

## API Endpoints

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments` | Create a new payment |
| GET | `/api/v1/payments/:orderId` | Get payments by order ID |
| PUT | `/api/v1/payments/:id/status` | Update payment status |
| GET | `/api/v1/user/:userId` | Get payments for a user |
| POST | `/api/v1/process` | Process a payment with payment provider |
| POST | `/api/v1/:id/refund` | Create a refund for a payment |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/stripe` | Stripe webhook endpoint for payment notifications |

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Stripe account (for payment processing)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3006
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ecom

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT (for auth)
JWT_SECRET=your_jwt_secret_key
```

### Installation

1. Clone the repository
2. Navigate to the payment service directory
   ```bash
   cd services/payment-service
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Start the development server
   ```bash
   npm run dev
   ```

The server will start on the configured port (default: 3006) and display URLs for the API and Swagger documentation.

### API Documentation

Swagger UI documentation is available at:
```
http://localhost:3006/documentation
```

This provides interactive documentation for all endpoints with request/response schemas.

### Example Usage

Here's an example of creating a payment using the API:

```javascript
// Example using fetch API
async function createPayment() {
  const response = await fetch('http://localhost:3006/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 99.99,
      currency: 'USD',
      paymentMethodId: '123e4567-e89b-12d3-a456-426614174111'
    })
  });

  const result = await response.json();
  console.log(result);
}
```

And processing a refund:

```javascript
async function refundPayment(paymentId) {
  const response = await fetch(`http://localhost:3006/api/v1/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      amount: 99.99, // Optional: if not provided, full amount will be refunded
    })
  });

  const result = await response.json();
  console.log(result);
}
```

## Development

### Build

```bash
npm run build
```

### Run in production

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Docker

### Building the Docker Image

```bash
docker build -t payment-service .
```

### Running with Docker

```bash
# Run the container
docker run -p 3006:3006 --name payment-service --env-file .env payment-service
```

### Docker Compose

Add the following service to your docker-compose.yml:

```yaml
services:
  payment-service:
    build:
      context: ./services/payment-service
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
```

## Integration with Other Services

The Payment Service integrates with:

- **Order Service** - To validate orders and update payment status
- **API Gateway** - For client communication
- **Auth Service** - For authentication and authorization

## Payment Flow

1. Client requests payment processing with payment method details
2. Payment is created and stored in pending status
3. Payment is processed with the payment provider (Stripe)
4. On successful payment, status is updated to completed
5. Order Service is notified about the payment status

### Refund Flow

1. Refund request is initiated for a specific payment
2. Refund is created in pending status
3. Refund is processed with the payment provider
4. On successful refund, both refund and payment statuses are updated
5. Order Service is notified about the refund

## Webhook Handling

The service handles webhooks from payment providers:

1. Webhook endpoint receives notifications from payment providers
2. Signature is verified to ensure authenticity
3. Based on event type, appropriate actions are taken
4. Payment records are updated accordingly

## Error Handling

The service implements comprehensive error handling:

- Validation errors return 400 status code
- Authentication errors return 401 status code
- Resource not found errors return 404 status code
- Server errors return 500 status code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 