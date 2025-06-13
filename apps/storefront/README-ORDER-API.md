# Order Service Integration

This document outlines how the Order Service is integrated with the Storefront application.

## API Endpoints

The Order Service exposes the following endpoints:

- `GET /orders` - List all orders for the authenticated user
- `GET /orders/:id` - Get a specific order by ID
- `POST /orders` - Create a new order
- `PUT /orders/:id` - Update an existing order
- `POST /orders/:id/cancel` - Cancel an order

## API Configuration

The Order Service API is configured using the `ORDER_API_URL` constant in `lib/constants.ts`. This allows the order service to be accessed directly rather than through the API Gateway.

```typescript
// Order API URL specifically for order service
export const ORDER_API_URL = process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:3005/api/v1';
```

## Data Model

The Order Service uses the following data model:

```typescript
// Order Service Model
interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  price: number;
  quantity: number;
  discountAmount: number;
  metadata: {
    name?: string;
    sku?: string;
    image?: string;
    variantName?: string;
    [key: string]: any;
  };
}
```

## Frontend Integration

The Storefront application integrates with the Order Service through the following components:

1. **API Routes**:
   - `/api/orders` - List and create orders
   - `/api/orders/[id]` - Get, update, and manage specific orders
   - `/api/orders/[id]/cancel` - Cancel an order

2. **Service Layer**:
   - `services/orders.ts` - Contains functions for interacting with the Order Service API

3. **UI Components**:
   - `/app/orders/page.tsx` - Displays a list of user orders
   - `/app/orders/[id]/page.tsx` - Displays order details
   - `/components/orders/StatusBadges.tsx` - Reusable components for displaying order status

## Data Mapping

The API routes handle mapping between the Order Service data model and the frontend data model. This includes:

- Converting status codes (e.g., `PENDING` to `pending`)
- Formatting addresses to match frontend requirements
- Calculating derived values like subtotals
- Extracting payment status from metadata

## Authentication

All Order Service endpoints require authentication. The Storefront application passes the user's JWT token in the `Authorization` header when making requests to the Order Service.

## Usage Examples

### Fetching Orders

```typescript
import { fetchOrders } from '@/services/orders';

// In a React component
const { data, error, isLoading } = useSWR(
  ['orders', page, status],
  () => fetchOrders({ page, pageSize: 10, status }),
);
```

### Creating an Order

```typescript
import { createOrder } from '@/services/orders';

// Example order creation
const newOrder = await createOrder({
  items: [
    { productId: '123', quantity: 2 },
    { productId: '456', quantity: 1 },
  ],
  shippingAddress: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    country: 'USA',
    postalCode: '12345',
  },
});
```

### Cancelling an Order

```typescript
import { cancelOrder } from '@/services/orders';

// Cancel an order
await cancelOrder('order-id-here');
``` 