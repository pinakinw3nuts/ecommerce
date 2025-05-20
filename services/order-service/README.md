# Order Service

A microservice for managing e-commerce orders with support for order lifecycle management, notes, and administrative functions.

## Features

- RESTful API for order management
- Order lifecycle tracking (Created → Processing → Shipped → Delivered)
- Internal and customer-facing order notes
- Role-based access control (Admin/Customer)
- Swagger documentation
- Docker support with PostgreSQL database

## API Endpoints

### Orders

- `GET /orders` - List all orders (Admin) or user's orders (Customer)
- `GET /orders/:orderId` - Get order details
- `POST /orders` - Create a new order
- `PUT /orders/:orderId` - Update order status/details

### Order Notes

- `GET /orders/:orderId/notes` - Get all notes for an order
- `POST /orders/:orderId/notes` - Add a note to an order
- `PUT /orders/:orderId/notes/:noteId` - Update an order note
- `DELETE /orders/:orderId/notes/:noteId` - Delete an order note

## Order Lifecycle

1. **Created**
   - Initial state when order is placed
   - Payment verification pending
   - Stock allocation initiated

2. **Processing**
   - Payment confirmed
   - Stock allocated
   - Order being prepared for shipment

3. **Shipped**
   - Order dispatched to carrier
   - Tracking information available
   - Customer notified

4. **Delivered**
   - Order confirmed as received
   - Return window starts
   - Customer feedback requested

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- PostgreSQL (if running locally)

### Environment Variables

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/order_db
JWT_SECRET=your_jwt_secret_here
```

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd services/order-service
```

2. Start the services:
```bash
docker-compose up -d
```

3. View the logs:
```bash
docker-compose logs -f
```

4. Access the API documentation:
```
http://localhost:3000/documentation
```

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL:
```bash
docker-compose up -d postgres
```

3. Run the service:
```bash
npm run dev
```

## API Documentation

The API documentation is available through Swagger UI at `/documentation` when the service is running. It includes:

- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests

## Security

- JWT-based authentication
- Role-based access control
- Admin-only endpoints protected
- Secure note visibility (internal/external)

## Error Handling

The service uses standard HTTP status codes:

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Development

### Code Style

The project uses TypeScript with strict type checking and ESLint for code quality.

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests with coverage
npm run test:coverage
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 