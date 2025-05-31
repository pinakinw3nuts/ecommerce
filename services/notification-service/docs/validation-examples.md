# Validation Middleware Examples

This document provides examples of how to use the Zod validation middleware in the notification service.

## Basic Usage

The validation middleware is used to validate request bodies, URL parameters, query strings, and headers before your route handler runs. Here's a basic example:

```typescript
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';

// Define a schema for the request body
const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional()
});

// Use the schema in a route
fastify.post('/users', {
  // ... other route configuration ...
  preHandler: validateRequest({ body: userSchema }),
  handler: async (request, reply) => {
    // The request body is already validated and typed!
    const user = request.body;
    // ...
  }
});
```

## Combining with Other Middleware

Validation middleware can be combined with other middleware, such as authentication and authorization:

```typescript
fastify.post('/admin/settings', {
  // ... other route configuration ...
  preHandler: [
    combinedAuthGuard,                   // First, authenticate the user
    roleGuard(['admin']),                // Then, check if they have the admin role
    validateRequest({ body: settingsSchema }) // Finally, validate the request body
  ],
  handler: async (request, reply) => {
    // The request is authenticated, authorized, and validated!
    const settings = request.body;
    // ...
  }
});
```

## Complex Schema Examples

### Nested Objects and Arrays

```typescript
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  categories: z.array(z.string()).min(1),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  variants: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number().positive().optional()
  })).optional()
});
```

### Union Types and Discriminated Unions

```typescript
const paymentMethodSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z.number().int().min(2023),
    cvv: z.string().regex(/^\d{3,4}$/)
  }),
  z.object({
    type: z.literal('paypal'),
    email: z.string().email()
  }),
  z.object({
    type: z.literal('bank_transfer'),
    accountNumber: z.string(),
    routingNumber: z.string()
  })
]);
```

### Schema Transformations

```typescript
const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
}).refine(
  data => new Date(data.from) < new Date(data.to),
  {
    message: "End date must be after start date",
    path: ["to"]
  }
).transform(data => ({
  from: new Date(data.from),
  to: new Date(data.to)
}));
```

## Validation Error Handling

The validation middleware automatically handles Zod validation errors and returns a structured response:

```json
{
  "message": "Validation error",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "path": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    },
    {
      "path": "items.0.quantity",
      "message": "Expected number, received string",
      "code": "invalid_type"
    }
  ]
}
```

## Schema Reuse

Schemas can be reused across different parts of the application:

```typescript
// In schemas/user.schemas.ts
export const userIdSchema = z.object({
  userId: z.string().uuid()
});

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['user', 'admin'])
});

export const userUpdateSchema = userCreateSchema.partial();

// In routes/user.routes.ts
import { userIdSchema, userCreateSchema, userUpdateSchema } from '../schemas/user.schemas';

fastify.post('/users', {
  preHandler: validateRequest({ body: userCreateSchema }),
  // ...
});

fastify.get('/users/:userId', {
  preHandler: validateRequest({ params: userIdSchema }),
  // ...
});

fastify.patch('/users/:userId', {
  preHandler: [
    validateRequest({ params: userIdSchema }),
    validateRequest({ body: userUpdateSchema })
  ],
  // ...
});
``` 