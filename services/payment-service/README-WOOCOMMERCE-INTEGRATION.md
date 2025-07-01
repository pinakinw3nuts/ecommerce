# WooCommerce-like Payment Gateway Implementation

This document describes the implementation of a WooCommerce-like payment gateway system in the payment service.

## Overview

The payment gateway system is designed to be flexible, configurable, and similar to WooCommerce's payment gateway architecture. It allows for:

1. Multiple payment gateway types (direct, redirect, iframe, offline)
2. Gateway-specific settings and configurations
3. Conditional availability based on order amount, currency, country, etc.
4. Custom ordering of payment gateways
5. Transaction fee calculation

## Key Components

### 1. Payment Gateway Entity

The `PaymentGateway` entity represents a payment gateway configuration with the following key fields:

- `code`: Unique identifier for the gateway
- `name`: Display name
- `description`: Description shown to customers
- `type`: Gateway type (direct, redirect, iframe, offline)
- `enabled`: Whether the gateway is active
- `displayOrder`: Order in which gateways are displayed
- `iconUrl`: URL to the gateway's icon
- `redirectUrl`: URL for redirect-based gateways
- `webhookUrl`: URL for webhook notifications
- `supportsRefunds`: Whether the gateway supports refunds
- `supportsSubscriptions`: Whether the gateway supports subscriptions
- `supportsSavedCards`: Whether the gateway supports saving payment methods
- `minAmount`/`maxAmount`: Amount constraints
- `transactionFeePercent`/`transactionFeeFixed`: Fee calculation
- `supportedCountries`/`excludedCountries`: Country restrictions
- `supportedCurrencies`: Currency restrictions
- `defaultOrderStatus`: Default status for orders using this gateway
- `paymentInstructions`: Instructions for customers
- `checkoutFields`: Custom fields to display at checkout
- `apiCredentials`: API credentials for the gateway
- `settings`: Additional gateway-specific settings

### 2. Payment Method Entity (Enhanced)

The `PaymentMethod` entity has been enhanced to support more payment types:

- Added more payment method types (digital wallet, bank transfer, check, etc.)
- Added more status options (pending, expired, declined)
- Added payment method categories (online, offline, manual)
- Added fields for payment instructions, processing time, etc.

### 3. Payment Gateway Service

The `PaymentGatewayService` provides methods for:

- Getting all payment gateways with filtering options
- Getting a specific gateway by code
- Creating, updating, and deleting gateways
- Enabling/disabling gateways
- Updating gateway display order
- Getting available gateways for a specific order
- Calculating transaction fees

### 4. API Endpoints

The following API endpoints are available for managing payment gateways:

- `GET /api/v1/payment-gateways`: List all payment gateways
- `GET /api/v1/payment-gateways/:code`: Get a specific payment gateway
- `POST /api/v1/payment-gateways`: Create a new payment gateway
- `PUT /api/v1/payment-gateways/:code`: Update a payment gateway
- `PATCH /api/v1/payment-gateways/:code/status`: Enable/disable a payment gateway
- `PUT /api/v1/payment-gateways/order`: Update payment gateway display order
- `POST /api/v1/payment-gateways/available`: Get available payment gateways for an order
- `DELETE /api/v1/payment-gateways/:code`: Delete a payment gateway

## Default Payment Gateways

The system comes with the following default payment gateways:

1. **Stripe**: Direct payment gateway for credit/debit cards
2. **PayPal**: Redirect payment gateway
3. **Razorpay**: Direct payment gateway
4. **Bank Transfer**: Offline payment gateway
5. **Check Payment**: Offline payment gateway
6. **Cash on Delivery**: Offline payment gateway

## Integration with WooCommerce

To integrate this payment service with WooCommerce, you would need to:

1. Create a WooCommerce plugin that communicates with this payment service
2. Map WooCommerce payment gateway settings to this service's payment gateway entity
3. Use the WooCommerce hooks system to intercept payment processing and delegate to this service
4. Implement webhook handlers for asynchronous payment updates

## Conditional Payment Methods

The system supports conditional payment methods based on:

1. **Order amount**: Set minimum and maximum order amounts for each gateway
2. **Customer location**: Set supported and excluded countries
3. **Currency**: Set supported currencies
4. **Custom logic**: Extend the `getAvailableGatewaysForOrder` method to implement custom rules

## Transaction Fees

Transaction fees can be calculated using:

1. Percentage-based fees (e.g., 2.9%)
2. Fixed fees (e.g., $0.30)
3. Combination of both

The `calculateTransactionFee` method in the `PaymentGatewayService` handles this calculation.

## Extending the System

To add a new payment gateway:

1. Create a new payment gateway using the API
2. Implement the necessary service methods (if not already covered)
3. Update the frontend to display and handle the new gateway

## Security Considerations

1. API credentials are stored in the database and should be encrypted
2. All payment gateway API endpoints require authentication
3. Webhook endpoints are excluded from authentication but should validate the request using signatures or other means 