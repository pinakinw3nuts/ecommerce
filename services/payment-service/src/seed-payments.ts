import { Payment, PaymentStatus, PaymentProvider } from './entities/payment.entity';
import { AppDataSource } from './plugins/typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { v4 as uuidv4 } from 'uuid';

async function seedPayments() {
  // Setup TypeORM DataSource
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  const paymentRepo = AppDataSource.getRepository(Payment);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);

  // Get available payment methods
  const paymentMethods = await paymentMethodRepo.find();
  
  if (paymentMethods.length === 0) {
    console.log('No payment methods found. Please run seed-payment-methods.ts first.');
    return;
  }

  // Create a default payment method ID to use as fallback
  if (!paymentMethods[0] || !paymentMethods[0].id) {
    console.log('Invalid payment method data. Please run seed-payment-methods.ts first.');
    return;
  }
  
  const defaultMethodId = paymentMethods[0].id;
  
  // Create 15 dummy payments with different statuses and providers
  console.log('Creating payments...');
  
  // 5 Stripe payments
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.COMPLETED,
    transactionId: `txn_${uuidv4().substring(0, 8)}`,
    currency: 'USD',
    amount: 129.99,
    providerPaymentId: `pi_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'succeeded', payment_method_details: { type: 'card', card: { brand: 'visa' } } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '123 Main St, City, Country', items_count: 3 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.REFUNDED,
    transactionId: `txn_${uuidv4().substring(0, 8)}`,
    currency: 'EUR',
    amount: 89.50,
    providerPaymentId: `pi_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'refunded', payment_method_details: { type: 'card', card: { brand: 'mastercard' } } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '456 Oak Ave, City, Country', items_count: 2 },
    refundedAmount: 89.50
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.FAILED,
    transactionId: `txn_${uuidv4().substring(0, 8)}`,
    currency: 'GBP',
    amount: 199.99,
    providerPaymentId: `pi_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'failed', error: { message: 'Insufficient funds' } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '101 Elm St, City, Country', items_count: 4 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.PENDING,
    transactionId: `txn_${uuidv4().substring(0, 8)}`,
    currency: 'CAD',
    amount: 75.25,
    providerPaymentId: `pi_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'processing' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '202 Maple St, City, Country', items_count: 2 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.COMPLETED,
    transactionId: `txn_${uuidv4().substring(0, 8)}`,
    currency: 'USD',
    amount: 59.99,
    providerPaymentId: `pi_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'succeeded', payment_method_details: { type: 'card', card: { brand: 'amex' } } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '789 Pine St, City, Country', items_count: 1 },
    refundedAmount: 0
  });
  
  // 5 PayPal payments
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.PAYPAL,
    status: PaymentStatus.COMPLETED,
    transactionId: `pp_${uuidv4().substring(0, 8)}`,
    currency: 'USD',
    amount: 149.99,
    providerPaymentId: `paypal_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'COMPLETED', payer: { email_address: 'customer@example.com' } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '303 Cedar St, City, Country', items_count: 3 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.PAYPAL,
    status: PaymentStatus.COMPLETED,
    transactionId: `pp_${uuidv4().substring(0, 8)}`,
    currency: 'EUR',
    amount: 49.99,
    providerPaymentId: `paypal_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'COMPLETED', payer: { email_address: 'customer2@example.com' } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '404 Birch St, City, Country', items_count: 1 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.PAYPAL,
    status: PaymentStatus.CANCELLED,
    transactionId: `pp_${uuidv4().substring(0, 8)}`,
    currency: 'AUD',
    amount: 99.99,
    providerPaymentId: `paypal_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'CANCELLED' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '505 Walnut St, City, Country', items_count: 2 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.PAYPAL,
    status: PaymentStatus.PROCESSING,
    transactionId: `pp_${uuidv4().substring(0, 8)}`,
    currency: 'USD',
    amount: 299.99,
    providerPaymentId: `paypal_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'PROCESSING' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '606 Spruce St, City, Country', items_count: 5 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.PAYPAL,
    status: PaymentStatus.FAILED,
    transactionId: `pp_${uuidv4().substring(0, 8)}`,
    currency: 'GBP',
    amount: 45.50,
    providerPaymentId: `paypal_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'FAILED', error: { message: 'Payment rejected' } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '707 Ash St, City, Country', items_count: 1 },
    refundedAmount: 0
  });
  
  // 5 Razorpay payments
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.RAZORPAY,
    status: PaymentStatus.COMPLETED,
    transactionId: `rzp_${uuidv4().substring(0, 8)}`,
    currency: 'INR',
    amount: 9999.00,
    providerPaymentId: `pay_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'captured' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '808 Teak St, City, Country', items_count: 4 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.RAZORPAY,
    status: PaymentStatus.COMPLETED,
    transactionId: `rzp_${uuidv4().substring(0, 8)}`,
    currency: 'INR',
    amount: 4999.00,
    providerPaymentId: `pay_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'captured' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '909 Redwood St, City, Country', items_count: 2 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.RAZORPAY,
    status: PaymentStatus.REFUNDED,
    transactionId: `rzp_${uuidv4().substring(0, 8)}`,
    currency: 'INR',
    amount: 2999.00,
    providerPaymentId: `pay_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'refunded' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '1010 Sequoia St, City, Country', items_count: 1 },
    refundedAmount: 2999.00
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.RAZORPAY,
    status: PaymentStatus.PENDING,
    transactionId: `rzp_${uuidv4().substring(0, 8)}`,
    currency: 'INR',
    amount: 7999.00,
    providerPaymentId: `pay_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'created' },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '1111 Bamboo St, City, Country', items_count: 3 },
    refundedAmount: 0
  });
  
  await createPayment(paymentRepo, {
    orderId: uuidv4(),
    userId: uuidv4(),
    provider: PaymentProvider.RAZORPAY,
    status: PaymentStatus.FAILED,
    transactionId: `rzp_${uuidv4().substring(0, 8)}`,
    currency: 'INR',
    amount: 1499.00,
    providerPaymentId: `pay_${uuidv4().substring(0, 8)}`,
    providerResponse: { status: 'failed', error: { description: 'Bank declined the transaction' } },
    paymentMethodId: defaultMethodId,
    metadata: { shipping_address: '1212 Mahogany St, City, Country', items_count: 1 },
    refundedAmount: 0
  });

  await AppDataSource.destroy();
  console.log('Payment seeding complete.');
}

// Helper function to create a payment
async function createPayment(repo: any, data: any) {
  const exists = await repo.findOneBy({ transactionId: data.transactionId });
  if (!exists) {
    await repo.save(repo.create(data));
    console.log(`Seeded payment: ${data.transactionId} (${data.provider} - ${data.status})`);
  } else {
    console.log(`Payment already exists: ${data.transactionId}`);
  }
}

seedPayments().catch(err => {
  console.error('Payment seeding failed:', err);
  process.exit(1);
}); 