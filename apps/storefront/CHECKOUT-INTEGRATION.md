# Checkout Service Integration Guide

This guide explains how to integrate the checkout service with the storefront application.

## Setup

1. Make sure the checkout service is running on port 3002 (default port)
2. Create or update your `.env.local` file in the `apps/storefront` directory with the following:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CHECKOUT_API_URL=http://localhost:3002/api/v1
```

## Integration Overview

The integration consists of:

1. A checkout service client (`services/checkout.ts`) that communicates with the checkout API
2. Updates to the checkout page to use the checkout service
3. A success page that displays order confirmation details

## Checkout Flow

1. User adds items to cart
2. User navigates to checkout page
3. The checkout page:
   - Fetches shipping options based on the user's address
   - Calculates order preview with shipping costs and discounts
   - Validates the user's address and payment information
   - Creates a checkout session when the user submits the order
4. After successful payment, the user is redirected to the success page
5. The success page displays the order confirmation details

## API Endpoints Used

The following checkout API endpoints are used:

- `POST /checkout/preview` - Calculate order preview with shipping and discount
- `POST /checkout/shipping-options` - Get available shipping options
- `POST /checkout/validate-pincode` - Validate postal/zip code
- `POST /checkout/session` - Create checkout session
- `GET /checkout/session/:id` - Get checkout session
- `POST /checkout/session/:id/complete` - Complete checkout session (after payment)

## Testing the Integration

1. Start the checkout service:
   ```
   cd services/checkout-service
   npm run dev
   ```

2. Start the storefront application:
   ```
   cd apps/storefront
   npm run dev
   ```

3. Navigate to the storefront, add items to cart, and proceed to checkout
4. Fill in shipping information and complete the checkout process
5. Verify that the order is created in the checkout service

## Troubleshooting

If you encounter issues with the integration:

1. Check that the checkout service is running and accessible
2. Verify that the environment variables are set correctly
3. Check the browser console for any API errors
4. Ensure that the cart contains valid items with all required fields

## Next Steps

Future improvements to consider:

1. Implement real payment processing integration
2. Add address validation and suggestion
3. Implement order tracking functionality
4. Add email notifications for order status updates