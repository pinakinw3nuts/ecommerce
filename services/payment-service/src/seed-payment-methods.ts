import { PaymentMethod, PaymentMethodType, PaymentMethodStatus } from './entities/payment-method.entity';
import { AppDataSource } from './plugins/typeorm';

async function seedPaymentMethods() {
  // Setup TypeORM DataSource
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const repo = AppDataSource.getRepository(PaymentMethod);

  // Dummy userId for seeding
  const userId = '00000000-0000-0000-0000-000000000001';

  // Dummy payment methods
  const methods: Partial<PaymentMethod>[] = [
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_1',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '2028',
      brand: 'Visa',
      status: PaymentMethodStatus.ACTIVE,
      isDefault: true,
      metadata: { nickname: 'Personal Visa' }
    },
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_2',
      last4: '1881',
      expiryMonth: '11',
      expiryYear: '2027',
      brand: 'Mastercard',
      status: PaymentMethodStatus.ACTIVE,
      isDefault: false,
      metadata: { nickname: 'Work Mastercard' }
    },
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_3',
      last4: '0005',
      expiryMonth: '09',
      expiryYear: '2026',
      brand: 'Amex',
      status: PaymentMethodStatus.INACTIVE,
      isDefault: false,
      metadata: { nickname: 'Old Amex' }
    },
    {
      userId,
      type: PaymentMethodType.BANK_ACCOUNT,
      provider: 'stripe',
      providerMethodId: 'pm_test_4',
      last4: '6789',
      expiryMonth: '',
      expiryYear: '',
      brand: 'Chase',
      status: PaymentMethodStatus.ACTIVE,
      isDefault: false,
      metadata: { nickname: 'Chase Checking' }
    },
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_5',
      last4: '5100',
      expiryMonth: '03',
      expiryYear: '2029',
      brand: 'Discover',
      status: PaymentMethodStatus.ACTIVE,
      isDefault: false,
      metadata: { nickname: 'Travel Discover' }
    },
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_6',
      last4: '2222',
      expiryMonth: '07',
      expiryYear: '2025',
      brand: 'Visa',
      status: PaymentMethodStatus.ACTIVE,
      isDefault: false,
      metadata: { nickname: 'Backup Visa' }
    },
    {
      userId,
      type: PaymentMethodType.CARD,
      provider: 'stripe',
      providerMethodId: 'pm_test_7',
      last4: '3333',
      expiryMonth: '10',
      expiryYear: '2024',
      brand: 'Mastercard',
      status: PaymentMethodStatus.INACTIVE,
      isDefault: false,
      metadata: { nickname: 'Expired Mastercard' }
    }
  ];

  // Insert payment methods
  for (const method of methods) {
    const exists = await repo.findOneBy({ providerMethodId: method.providerMethodId as string });
    if (!exists) {
      await repo.save(repo.create(method));
      console.log(`Seeded payment method: ${method.providerMethodId}`);
    } else {
      console.log(`Payment method already exists: ${method.providerMethodId}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seeding complete.');
}

seedPaymentMethods().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
}); 