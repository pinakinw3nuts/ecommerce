# Payment Service Seed Scripts

This document explains how to use the seed scripts to populate your database with test data for the payment service.

## Available Seed Scripts

The payment service provides two seed scripts:

1. **Payment Methods Seed**: Creates 7 dummy payment methods with different providers and types
2. **Payments Seed**: Creates 15 dummy payment records with different payment methods, statuses, and providers

## Prerequisites

Before running the seed scripts, make sure:

1. Your database is properly configured in the environment variables
2. The database tables have been created (run migrations if needed)
3. You have installed all dependencies (`npm install`)

## Running the Seed Scripts

### Step 1: Seed Payment Methods

First, you need to seed the payment methods since payments depend on them:

```bash
npm run seed-methods
```

This will create 7 payment methods with different providers (Stripe, PayPal, Razorpay) and types (card, bank account).

### Step 2: Seed Payments

After seeding the payment methods, you can seed the payments:

```bash
npm run seed-payments
```

This will create 15 dummy payment records with:
- Different payment providers (Stripe, PayPal, Razorpay)
- Various payment statuses (completed, pending, failed, refunded, cancelled)
- Different currencies (USD, EUR, GBP, CAD, AUD, INR)
- Random order IDs and user IDs
- Realistic metadata and provider responses

## Data Overview

### Payment Methods

The seed script creates payment methods with:
- Different card brands (Visa, Mastercard, Amex, Discover)
- Different statuses (active, inactive)
- Bank account options
- Various expiry dates

### Payments

The seed script creates payments with:
- 5 Stripe payments (various statuses)
- 5 PayPal payments (various statuses)
- 5 Razorpay payments (various statuses)
- Different currencies based on the provider
- Realistic transaction IDs and provider payment IDs
- Metadata including shipping addresses and item counts
- Refund information for refunded payments

## Customization

If you need to customize the seed data:

1. Edit `src/seed-payment-methods.ts` to modify payment method data
2. Edit `src/seed-payments.ts` to modify payment data

You can adjust:
- The number of records
- Payment amounts and currencies
- Status distributions
- Provider-specific details
- Metadata content 