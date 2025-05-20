import { Repository } from 'typeorm'
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity'
import { logger } from '../utils/logger'
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity'
import { StripeService } from './stripe.service'

const paymentLogger = logger.child({ service: 'PaymentService' })

export class PaymentService {
  private paymentRepo: Repository<Payment>
  private paymentMethodRepo: Repository<PaymentMethodEntity>
  private stripeService: StripeService

  constructor(
    paymentRepo: Repository<Payment>,
    paymentMethodRepo: Repository<PaymentMethodEntity>,
    stripeService: StripeService
  ) {
    this.paymentRepo = paymentRepo
    this.paymentMethodRepo = paymentMethodRepo
    this.stripeService = stripeService
  }

  // Create and process a new payment
  async createPayment(data: {
    orderId: string
    userId: string
    amount: number
    currency: string
    paymentMethodId: string
  }): Promise<Payment> {
    const paymentMethod = await this.paymentMethodRepo.findOneBy({
      id: data.paymentMethodId
    })

    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    // Create payment record
    const payment = this.paymentRepo.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      paymentMethodId: data.paymentMethodId,
      status: PaymentStatus.PENDING
    })

    await this.paymentRepo.save(payment)

    try {
      // Process payment with Stripe
      const stripePayment = await this.stripeService.createPayment({
        amount: data.amount,
        currency: data.currency,
        paymentMethodId: paymentMethod.providerMethodId,
        description: `Payment for order ${data.orderId}`
      })

      // Update payment record with provider response
      payment.providerPaymentId = stripePayment.id
      payment.providerResponse = stripePayment
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

  async refundPayment(paymentId: string, amount?: number) {
    const payment = await this.getPayment(paymentId)

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Payment cannot be refunded')
    }

    try {
      if (!payment.providerPaymentId) {
        throw new Error('No payment ID found to process refund');
      }
      
      const refund = await this.stripeService.createRefund(
        payment.providerPaymentId,
        amount
      )

      payment.status = PaymentStatus.REFUNDED
      payment.metadata = {
        ...payment.metadata,
        refund: refund
      }

      await this.paymentRepo.save(payment)

      return payment
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
} 