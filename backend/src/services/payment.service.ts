import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus, PaymentProvider, SupportedPaymentProvider } from '../entities/Payment';
import { PaymentMethod, PaymentMethodType, PaymentMethodStatus } from '../entities/PaymentMethod';
import { PaymentGateway } from '../entities/PaymentGateway';
import { Refund, RefundStatus } from '../entities/Refund';
import { logger } from '../utils/logger';

const paymentLogger = logger.child({ service: 'PaymentService' });

export class PaymentService {
  private paymentRepo: Repository<Payment>;
  private paymentMethodRepo: Repository<PaymentMethod>;
  private paymentGatewayRepo: Repository<PaymentGateway>;
  private refundRepo: Repository<Refund>;

  constructor() {
    this.paymentRepo = AppDataSource.getRepository(Payment);
    this.paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);
    this.paymentGatewayRepo = AppDataSource.getRepository(PaymentGateway);
    this.refundRepo = AppDataSource.getRepository(Refund);
  }

  // Create and process a new payment (multi-provider)
  async createPayment(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethodId: string;
    provider?: SupportedPaymentProvider;
    description?: string;
  }): Promise<Payment> {
    const paymentMethod = await this.paymentMethodRepo.findOneBy({
      id: data.paymentMethodId
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Determine provider
    const provider: SupportedPaymentProvider = data.provider || (paymentMethod.provider as SupportedPaymentProvider) || 'stripe';

    // Create payment record
    const payment = this.paymentRepo.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      paymentMethodId: data.paymentMethodId,
      provider: provider as PaymentProvider,
      status: PaymentStatus.PENDING
    });

    await this.paymentRepo.save(payment);

    try {
      // Simulate payment processing (in real implementation, this would call actual payment providers)
      payment.status = PaymentStatus.COMPLETED;
      payment.providerPaymentId = `sim_${Date.now()}`;
      payment.providerResponse = { success: true, message: 'Payment processed successfully' };
      
      await this.paymentRepo.save(payment);

      paymentLogger.info('Payment created successfully', { paymentId: payment.id, orderId: data.orderId });
      return payment;
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.providerResponse = { error: error instanceof Error ? error.message : 'Unknown error' };
      await this.paymentRepo.save(payment);
      
      paymentLogger.error('Payment processing failed', { paymentId: payment.id, error });
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { id },
      relations: ['paymentMethod', 'refunds']
    });
  }

  // Get payments by order ID
  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { orderId },
      relations: ['paymentMethod', 'refunds']
    });
  }

  // Get payments by customer ID with filtering
  async getPaymentsByCustomerId(
    customerId: string,
    options: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payment.refunds', 'refunds')
      .where('payment.userId = :customerId', { customerId });

    if (options.status) {
      queryBuilder.andWhere('payment.status = :status', { status: options.status });
    }

    if (options.method) {
      queryBuilder.andWhere('payment.paymentMethodId = :methodId', { methodId: options.method.id });
    }

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    queryBuilder.orderBy('payment.createdAt', 'DESC');

    const payments = await queryBuilder.getMany();

    return { payments, total };
  }

  // Update payment status
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Payment> {
    const payment = await this.paymentRepo.findOneBy({ id });
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = status;
    if (metadata) {
      payment.metadata = { ...payment.metadata, ...metadata };
    }

    await this.paymentRepo.save(payment);
    paymentLogger.info('Payment status updated', { paymentId: id, status });
    return payment;
  }

  // Get customer payment statistics
  async getCustomerPaymentStats(customerId: string): Promise<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    paymentMethods: Record<string, number>;
  }> {
    const payments = await this.paymentRepo.find({
      where: { userId: customerId }
    });

    const stats = {
      totalPaid: 0,
      totalPending: 0,
      totalFailed: 0,
      paymentMethods: {} as Record<string, number>
    };

    payments.forEach(payment => {
      if (payment.status === PaymentStatus.COMPLETED) {
        stats.totalPaid += Number(payment.amount);
      } else if (payment.status === PaymentStatus.PENDING) {
        stats.totalPending += Number(payment.amount);
      } else if (payment.status === PaymentStatus.FAILED) {
        stats.totalFailed += Number(payment.amount);
      }

      const provider = payment.provider;
      stats.paymentMethods[provider] = (stats.paymentMethods[provider] || 0) + 1;
    });

    return stats;
  }

  // Create payment method
  async createPaymentMethod(userId: string, data: {
    type: PaymentMethodType;
    provider: string;
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    isDefault?: boolean;
    metadata?: Record<string, any>;
  }): Promise<PaymentMethod> {
    // In a real implementation, you would validate the card with the payment provider
    const last4 = data.card.number.slice(-4);
    const providerMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const paymentMethod = this.paymentMethodRepo.create({
      userId,
      type: data.type,
      provider: data.provider,
      providerMethodId,
      last4,
      expiryMonth: data.card.exp_month.toString(),
      expiryYear: data.card.exp_year.toString(),
      brand: 'visa', // This would be determined by the card number
      isDefault: data.isDefault || false,
      metadata: data.metadata || {}
    });

    // If this is the default method, unset other defaults
    if (data.isDefault) {
      await this.paymentMethodRepo.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    await this.paymentMethodRepo.save(paymentMethod);
    paymentLogger.info('Payment method created', { userId, methodId: paymentMethod.id });
    return paymentMethod;
  }

  // Get user's payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  // Get payment method by ID
  async getPaymentMethodById(userId: string, id: string): Promise<PaymentMethod | null> {
    return this.paymentMethodRepo.findOneBy({ id, userId });
  }

  // Update payment method
  async updatePaymentMethod(userId: string, id: string, data: Partial<{
    status?: PaymentMethodStatus;
    isDefault?: boolean;
    metadata?: Record<string, any>;
  }>): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepo.findOneBy({ id, userId });
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    Object.assign(paymentMethod, data);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.paymentMethodRepo.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    await this.paymentMethodRepo.save(paymentMethod);
    paymentLogger.info('Payment method updated', { userId, methodId: id });
    return paymentMethod;
  }

  // Delete payment method
  async deletePaymentMethod(userId: string, id: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepo.findOneBy({ id, userId });
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    await this.paymentMethodRepo.remove(paymentMethod);
    paymentLogger.info('Payment method deleted', { userId, methodId: id });
  }

  // Process refund
  async processRefund(paymentId: string, amount: number, reason: string, requestedBy: string): Promise<Refund> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['refunds']
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.canBeRefunded()) {
      throw new Error('Payment cannot be refunded');
    }

    const refundableAmount = payment.getRefundableAmount();
    if (amount > refundableAmount) {
      throw new Error(`Refund amount exceeds refundable amount. Maximum: ${refundableAmount}`);
    }

    const refund = this.refundRepo.create({
      paymentId,
      amount,
      reason,
      requestedBy,
      status: RefundStatus.PENDING
    });

    await this.refundRepo.save(refund);

    // Update payment refunded amount
    payment.refundedAmount = Number(payment.refundedAmount) + amount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    }
    await this.paymentRepo.save(payment);

    paymentLogger.info('Refund created', { paymentId, refundId: refund.id, amount });
    return refund;
  }

  // Get refund by ID
  async getRefundById(id: string): Promise<Refund | null> {
    return this.refundRepo.findOne({
      where: { id },
      relations: ['payment']
    });
  }

  // Update refund status
  async updateRefundStatus(id: string, status: RefundStatus, transactionId?: string): Promise<Refund> {
    const refund = await this.refundRepo.findOneBy({ id });
    if (!refund) {
      throw new Error('Refund not found');
    }

    refund.status = status;
    if (transactionId) {
      refund.transactionId = transactionId;
    }

    await this.refundRepo.save(refund);
    paymentLogger.info('Refund status updated', { refundId: id, status });
    return refund;
  }

  // Get payment gateways
  async getPaymentGateways(): Promise<PaymentGateway[]> {
    return this.paymentGatewayRepo.find({
      where: { enabled: true },
      order: { displayOrder: 'ASC' }
    });
  }

  // Get payment gateway by code
  async getPaymentGatewayByCode(code: string): Promise<PaymentGateway | null> {
    return this.paymentGatewayRepo.findOneBy({ code, enabled: true });
  }

  // Admin: Get all payments with filtering
  async getAllPayments(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    orderId?: string;
    status?: string;
    provider?: string;
    fromDate?: string;
    toDate?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ payments: Payment[]; total: number }> {
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payment.refunds', 'refunds');

    if (options.search) {
      queryBuilder.andWhere(
        '(payment.transactionId ILIKE :search OR payment.providerPaymentId ILIKE :search)',
        { search: `%${options.search}%` }
      );
    }

    if (options.orderId) {
      queryBuilder.andWhere('payment.orderId = :orderId', { orderId: options.orderId });
    }

    if (options.status) {
      queryBuilder.andWhere('payment.status = :status', { status: options.status });
    }

    if (options.provider) {
      queryBuilder.andWhere('payment.provider = :provider', { provider: options.provider });
    }

    if (options.fromDate) {
      queryBuilder.andWhere('payment.createdAt >= :fromDate', { fromDate: options.fromDate });
    }

    if (options.toDate) {
      queryBuilder.andWhere('payment.createdAt <= :toDate', { toDate: options.toDate });
    }

    if (options.minAmount) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount: options.minAmount });
    }

    if (options.maxAmount) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount: options.maxAmount });
    }

    const total = await queryBuilder.getCount();

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    queryBuilder.orderBy(`payment.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    if (options.page && options.pageSize) {
      queryBuilder.skip((options.page - 1) * options.pageSize).take(options.pageSize);
    }

    const payments = await queryBuilder.getMany();

    return { payments, total };
  }

  // Admin: Get all payment methods with filtering
  async getAllPaymentMethods(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    provider?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ paymentMethods: PaymentMethod[]; total: number }> {
    const queryBuilder = this.paymentMethodRepo.createQueryBuilder('paymentMethod');

    if (options.search) {
      queryBuilder.andWhere(
        '(paymentMethod.last4 ILIKE :search OR paymentMethod.providerMethodId ILIKE :search)',
        { search: `%${options.search}%` }
      );
    }

    if (options.status) {
      queryBuilder.andWhere('paymentMethod.status = :status', { status: options.status });
    }

    if (options.provider) {
      queryBuilder.andWhere('paymentMethod.provider = :provider', { provider: options.provider });
    }

    if (options.type) {
      queryBuilder.andWhere('paymentMethod.type = :type', { type: options.type });
    }

    const total = await queryBuilder.getCount();

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    queryBuilder.orderBy(`paymentMethod.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    if (options.page && options.pageSize) {
      queryBuilder.skip((options.page - 1) * options.pageSize).take(options.pageSize);
    }

    const paymentMethods = await queryBuilder.getMany();

    return { paymentMethods, total };
  }
} 