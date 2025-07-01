import { Repository } from 'typeorm'
import { Payment, PaymentStatus, PaymentMethod, SupportedPaymentProvider, PaymentProvider } from '../entities/payment.entity'
import { logger } from '../utils/logger'
import { PaymentMethod as PaymentMethodEntity, PaymentMethodType, PaymentMethodStatus } from '../entities/payment-method.entity'
import { StripeService } from './stripe.service'
import { RazorpayService } from './razorpay.service'
import { PaypalService } from './paypal.service'

const paymentLogger = logger.child({ service: 'PaymentService' })

export class PaymentService {
  private paymentRepo: Repository<Payment>
  private paymentMethodRepo: Repository<PaymentMethodEntity>
  private stripeService: StripeService
  private razorpayService: RazorpayService
  private paypalService: PaypalService

  constructor(
    paymentRepo: Repository<Payment>,
    paymentMethodRepo: Repository<PaymentMethodEntity>,
    stripeService: StripeService,
    razorpayService: RazorpayService,
    paypalService: PaypalService
  ) {
    this.paymentRepo = paymentRepo
    this.paymentMethodRepo = paymentMethodRepo
    this.stripeService = stripeService
    this.razorpayService = razorpayService
    this.paypalService = paypalService
  }

  // Create and process a new payment (multi-provider)
  async createPayment(data: {
    orderId: string
    userId: string
    amount: number
    currency: string
    paymentMethodId: string
    provider?: SupportedPaymentProvider
    description?: string
  }): Promise<Payment> {
    const paymentMethod = await this.paymentMethodRepo.findOneBy({
      id: data.paymentMethodId
    })

    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    // Determine provider
    const provider: SupportedPaymentProvider = data.provider || (paymentMethod.provider as SupportedPaymentProvider) || 'stripe'

    // Create payment record
    const payment = this.paymentRepo.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      paymentMethodId: data.paymentMethodId,
      provider: provider as PaymentProvider,
      status: PaymentStatus.PENDING
    })

    await this.paymentRepo.save(payment)

    try {
      let providerPayment
      if (provider === 'stripe') {
        providerPayment = await this.stripeService.createPayment({
          amount: data.amount,
          currency: data.currency,
          paymentMethodId: paymentMethod.providerMethodId,
          description: data.description || `Payment for order ${data.orderId}`
        })
      } else if (provider === 'razorpay') {
        providerPayment = await this.razorpayService.createPayment({
          amount: data.amount,
          currency: data.currency,
          paymentMethodId: paymentMethod.providerMethodId,
          description: data.description || `Payment for order ${data.orderId}`
        })
      } else if (provider === 'paypal') {
        providerPayment = await this.paypalService.createPayment({
          amount: data.amount,
          currency: data.currency,
          paymentMethodId: paymentMethod.providerMethodId,
          description: data.description || `Payment for order ${data.orderId}`
        })
      } else {
        throw new Error('Unsupported payment provider')
      }

      // Update payment record with provider response
      payment.providerPaymentId = providerPayment.id
      payment.providerResponse = providerPayment
      payment.status = PaymentStatus.COMPLETED
      
      await this.paymentRepo.save(payment)

      return payment
    } catch (error) {
      // Update payment status to failed
      payment.status = PaymentStatus.FAILED
      payment.providerResponse = error instanceof Object ? error : { message: String(error) }
      await this.paymentRepo.save(payment)

      logger.error({ err: error, paymentId: payment.id }, 'Payment processing failed')
      throw error
    }
  }

  

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { id },
      relations: ['refunds']
    })
  }

  // Get payments by order ID
  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { orderId },
      relations: ['refunds']
    })
  }

  // Get payments by customer ID
  async getPaymentsByCustomerId(
    customerId: string,
    options: {
      status?: PaymentStatus
      method?: PaymentMethod
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const query = this.paymentRepo.createQueryBuilder('payment')
      .where('payment.customerId = :customerId', { customerId })
      .leftJoinAndSelect('payment.refunds', 'refund')

    if (options.status) {
      query.andWhere('payment.status = :status', { status: options.status })
    }

    if (options.method) {
      query.andWhere('payment.method = :method', { method: options.method })
    }

    const [payments, total] = await query
      .take(options.limit || 10)
      .skip(options.offset || 0)
      .getManyAndCount()

    return { payments, total }
  }

  // Update payment status
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Payment> {
    const payment = await this.getPaymentById(id)
    if (!payment) {
      throw new Error('Payment not found')
    }

    payment.status = status
    if (metadata) {
      payment.metadata = {
        ...payment.metadata,
        ...metadata,
        statusUpdateTimestamp: new Date()
      }
    }

    await this.paymentRepo.save(payment)
    paymentLogger.info(
      { 
        paymentId: payment.id,
        oldStatus: payment.status,
        newStatus: status
      },
      'Payment status updated'
    )

    return payment
  }

  // Calculate payment statistics for a customer
  async getCustomerPaymentStats(customerId: string): Promise<{
    totalPaid: number
    totalPending: number
    totalFailed: number
    paymentMethods: Record<string, number>
  }> {
    const payments = await this.paymentRepo.find({
      where: { userId: customerId }
    })

    const stats = {
      totalPaid: 0,
      totalPending: 0,
      totalFailed: 0,
      paymentMethods: Object.values(PaymentMethod).reduce(
        (acc, method) => ({ ...acc, [method]: 0 }),
        {} as Record<string, number>
      )
    }

    payments.forEach(payment => {
      switch (payment.status) {
        case PaymentStatus.COMPLETED:
          stats.totalPaid += Number(payment.amount)
          break
        case PaymentStatus.PENDING:
          stats.totalPending += Number(payment.amount)
          break
        case PaymentStatus.FAILED:
          stats.totalFailed += Number(payment.amount)
          break
      }
      if (payment.paymentMethodId) {
        stats.paymentMethods[payment.paymentMethodId]++;
      }
    })

    return stats
  }

  async getPayment(id: string) {
    return this.paymentRepo.findOne({
      where: { id },
      relations: ['paymentMethod']
    })
  }

  async getUserPayments(userId: string, options: {
    page?: number
    limit?: number
    status?: PaymentStatus
  }) {
    const { page = 1, limit = 10, status } = options

    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .where('payment.userId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status })
    }

    const [payments, total] = await queryBuilder.getManyAndCount()

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Refund payment (multi-provider)
  async refundPayment(paymentId: string, amount?: number) {
    const payment = await this.getPaymentById(paymentId)

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Payment cannot be refunded')
    }

    try {
      let providerRefund
      if (payment.provider === 'stripe') {
        providerRefund = await this.stripeService.createRefund(payment.providerPaymentId!, amount)
      } else if (payment.provider === 'razorpay') {
        providerRefund = await this.razorpayService.refundPayment(payment.providerPaymentId!, amount)
      } else if (payment.provider === 'paypal') {
        providerRefund = await this.paypalService.refundPayment(payment.providerPaymentId!, amount)
      } else {
        throw new Error('Unsupported payment provider')
      }

      payment.status = PaymentStatus.REFUNDED
      payment.metadata = {
        ...payment.metadata,
        refund: providerRefund
      }

      await this.paymentRepo.save(payment)

      return providerRefund
    } catch (error) {
      logger.error({ err: error, paymentId }, 'Refund processing failed')
      throw error
    }
  }

  // Handle Stripe webhook events
  async handleStripeWebhook(rawBody: string, signature: string, webhookSecret: string) {
    return this.stripeService.handleWebhookEvent(
      Buffer.from(rawBody),
      signature,
      webhookSecret
    );
  }

  // Handle PayPal webhook events
  async handlePaypalWebhook(rawBody: string, webhookId: string, webhookSignature: string) {
    return this.paypalService.handleWebhookEvent(
      rawBody,
      webhookId,
      webhookSignature
    );
  }

  // Handle Razorpay webhook events
  async handleRazorpayWebhook(rawBody: string, signature: string) {
    return this.razorpayService.handleWebhookEvent(
      rawBody,
      signature
    );
  }

  // Payment Method CRUD
  async createPaymentMethod(userId: string, data: {
    type: PaymentMethodType;
    provider: string;
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    isDefault?: boolean | undefined;
    metadata?: Record<string, any> | undefined;
  }) {
    // Create in Stripe (if provider is stripe)
    let providerMethodId = '';
    let brand = '';
    let last4 = '';
    if (data.provider === 'stripe') {
      const paymentMethod = await this.stripeService.createPaymentMethod({
        type: 'card',
        card: data.card
      });
      providerMethodId = paymentMethod.id;
      brand = paymentMethod.card?.brand ?? '';
      last4 = paymentMethod.card?.last4 ?? '';
    }
    // Save in DB
    const paymentMethod = this.paymentMethodRepo.create({
      userId,
      type: data.type,
      provider: data.provider,
      providerMethodId,
      last4,
      expiryMonth: data.card.exp_month.toString(),
      expiryYear: data.card.exp_year.toString(),
      brand,
      status: PaymentMethodStatus.ACTIVE,
      isDefault: data.isDefault ?? false,
      metadata: data.metadata ?? {}
    });
    if (paymentMethod.isDefault) {
      // Unset previous default
      await this.paymentMethodRepo.update({ userId, isDefault: true }, { isDefault: false });
    }
    return this.paymentMethodRepo.save(paymentMethod);
  }

  async getPaymentMethods(userId: string) {
    return this.paymentMethodRepo.find({ where: { userId } });
  }

  async getPaymentMethodById(userId: string, id: string) {
    return this.paymentMethodRepo.findOne({ where: { id, userId } });
  }

  async updatePaymentMethod(userId: string, id: string, data: Partial<{
    status?: PaymentMethodStatus;
    isDefault?: boolean | undefined;
    metadata?: Record<string, any> | undefined;
  }>) {
    const paymentMethod = await this.getPaymentMethodById(userId, id);
    if (!paymentMethod) throw new Error('Payment method not found');
    if (data.isDefault) {
      await this.paymentMethodRepo.update({ userId, isDefault: true }, { isDefault: false });
      paymentMethod.isDefault = true;
    }
    if (data.status) paymentMethod.status = data.status;
    if (data.metadata) paymentMethod.metadata = { ...paymentMethod.metadata, ...data.metadata };
    return this.paymentMethodRepo.save(paymentMethod);
  }

  async deletePaymentMethod(userId: string, id: string) {
    const paymentMethod = await this.getPaymentMethodById(userId, id);
    if (!paymentMethod) throw new Error('Payment method not found');
    if (paymentMethod.provider === 'stripe') {
      await this.stripeService.deletePaymentMethod(paymentMethod.providerMethodId);
    }
    return this.paymentMethodRepo.remove(paymentMethod);
  }

  // Get all payments with filtering and pagination for admin
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
  }) {
    const {
      page = 1,
      pageSize = 10,
      search,
      orderId,
      status,
      provider,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Create query builder
    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payment.refunds', 'refund');

    // Apply filters
    if (orderId) {
      // Direct order ID search (exact match)
      queryBuilder.andWhere('payment.orderId = :orderId', { orderId });
    } else if (search) {
      // General search (partial match)
      queryBuilder.andWhere(
        '(payment.orderId LIKE :search OR payment.transactionId LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Handle status filter - support multiple statuses
    if (status) {
      // Check if status contains multiple values
      if (status.includes(',')) {
        const statusValues = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statusValues.length > 0) {
          queryBuilder.andWhere('payment.status IN (:...statusValues)', { statusValues });
        }
      } else {
        // Single status value
        queryBuilder.andWhere('payment.status = :status', { status });
      }
    }

    // Handle provider filter - support multiple providers
    if (provider) {
      // Check if provider contains multiple values
      if (provider.includes(',')) {
        const providerValues = provider.split(',').map(p => p.trim()).filter(Boolean);
        if (providerValues.length > 0) {
          queryBuilder.andWhere('payment.provider IN (:...providerValues)', { providerValues });
        }
      } else {
        // Single provider value
        queryBuilder.andWhere('payment.provider = :provider', { provider });
      }
    }

    if (fromDate) {
      queryBuilder.andWhere('payment.createdAt >= :fromDate', { 
        fromDate: new Date(fromDate) 
      });
    }

    if (toDate) {
      queryBuilder.andWhere('payment.createdAt <= :toDate', { 
        toDate: new Date(toDate) 
      });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount });
    }

    // Apply sorting
    try {
      // Validate sortBy to prevent SQL injection
      const validSortColumns = [
        'id', 'orderId', 'userId', 'provider', 'status', 
        'amount', 'currency', 'createdAt', 'updatedAt', 'refundedAmount'
      ];
      
      // Default to createdAt if sortBy is not valid
      const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
      
      // Apply sorting
      queryBuilder.orderBy(`payment.${actualSortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } catch (error) {
      // If there's an error with sorting, fall back to default sort
      console.error('Error applying sort:', error);
      queryBuilder.orderBy('payment.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // Execute query
    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      items: payments,
      pagination: {
        total,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Get all payment methods with filtering and pagination for admin
  async getAllPaymentMethods(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    provider?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      provider,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Create query builder
    const queryBuilder = this.paymentMethodRepo
      .createQueryBuilder('paymentMethod');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(paymentMethod.brand LIKE :search OR paymentMethod.last4 LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Handle status filter - support multiple statuses
    if (status) {
      // Check if status contains multiple values
      if (status.includes(',')) {
        const statusValues = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statusValues.length > 0) {
          queryBuilder.andWhere('paymentMethod.status IN (:...statusValues)', { statusValues });
        }
      } else {
        // Single status value
        queryBuilder.andWhere('paymentMethod.status = :status', { status });
      }
    }

    // Handle provider filter - support multiple providers
    if (provider) {
      // Check if provider contains multiple values
      if (provider.includes(',')) {
        const providerValues = provider.split(',').map(p => p.trim()).filter(Boolean);
        if (providerValues.length > 0) {
          queryBuilder.andWhere('paymentMethod.provider IN (:...providerValues)', { providerValues });
        }
      } else {
        // Single provider value
        queryBuilder.andWhere('paymentMethod.provider = :provider', { provider });
      }
    }

    // Handle type filter - support multiple types
    if (type) {
      // Check if type contains multiple values
      if (type.includes(',')) {
        const typeValues = type.split(',').map(t => t.trim()).filter(Boolean);
        if (typeValues.length > 0) {
          queryBuilder.andWhere('paymentMethod.type IN (:...typeValues)', { typeValues });
        }
      } else {
        // Single type value
        queryBuilder.andWhere('paymentMethod.type = :type', { type });
      }
    }

    // Apply sorting
    try {
      // Validate sortBy to prevent SQL injection
      const validSortColumns = [
        'id', 'userId', 'type', 'provider', 'brand', 'last4', 
        'expiryMonth', 'expiryYear', 'status', 'isDefault', 'createdAt', 'updatedAt'
      ];
      
      // Default to createdAt if sortBy is not valid
      const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
      
      // Apply sorting
      queryBuilder.orderBy(`paymentMethod.${actualSortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } catch (error) {
      // If there's an error with sorting, fall back to default sort
      console.error('Error applying sort:', error);
      queryBuilder.orderBy('paymentMethod.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // Execute query
    const [paymentMethods, total] = await queryBuilder.getManyAndCount();

    return {
      items: paymentMethods,
      pagination: {
        total,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
} 