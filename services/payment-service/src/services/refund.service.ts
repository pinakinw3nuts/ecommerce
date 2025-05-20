import { Repository } from 'typeorm'
import { Refund, RefundStatus } from '../entities/refund.entity'
import { Payment, PaymentStatus } from '../entities/payment.entity'
import { PaymentGateway } from '../utils/gateway'
import { logger } from '../utils/logger'

const refundLogger = logger.child({ service: 'RefundService' })

export class RefundService {
  constructor(
    private readonly refundRepository: Repository<Refund>,
    private readonly paymentRepository: Repository<Payment>
  ) {}

  // Create and process a new refund
  async createRefund(data: {
    paymentId: string
    amount: number
    reason: string
    requestedBy: string
    metadata?: Record<string, unknown>
  }): Promise<Refund> {
    // Get original payment
    const payment = await this.paymentRepository.findOne({
      where: { id: data.paymentId },
      relations: ['refunds']
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Validate refund eligibility
    await this.validateRefundEligibility(payment, data.amount)

    // Create refund record
    const refund = this.refundRepository.create({
      paymentId: payment.id,
      amount: data.amount,
      reason: data.reason,
      status: RefundStatus.PENDING,
      requestedBy: data.requestedBy,
      metadata: {
        ...data.metadata,
        originalPaymentMethod: payment.paymentMethodId,
        originalTransactionId: payment.transactionId
      }
    })

    // Save initial refund record
    await this.refundRepository.save(refund)
    refundLogger.info(
      { refundId: refund.id, paymentId: payment.id },
      'Refund record created'
    )

    try {
      // Check if transaction ID exists
      if (!payment.transactionId) {
        throw new Error('No transaction ID found for this payment');
      }
      
      // Process refund through gateway
      const refundResponse = await PaymentGateway.refund(
        payment.transactionId,
        data.amount,
        data.reason
      )

      // Update refund status based on gateway response
      refund.status = refundResponse.success ? RefundStatus.COMPLETED : RefundStatus.FAILED
      refund.transactionId = refundResponse.transactionId
      refund.metadata = {
        ...refund.metadata,
        gatewayResponse: {
          message: refundResponse.message,
          timestamp: refundResponse.timestamp,
          metadata: refundResponse.metadata
        }
      }

      await this.refundRepository.save(refund)

      // Update payment refunded amount and status if successful
      if (refundResponse.success) {
        payment.refundedAmount = Number(payment.refundedAmount) + Number(data.amount)
        
        // If fully refunded, update payment status
        if (payment.refundedAmount >= payment.amount) {
          payment.status = PaymentStatus.REFUNDED
        }
        
        await this.paymentRepository.save(payment)
      }

      refundLogger.info(
        {
          refundId: refund.id,
          paymentId: payment.id,
          status: refund.status,
          transactionId: refund.transactionId
        },
        'Refund processed'
      )

      return refund
    } catch (error) {
      // Handle refund processing errors
      refund.status = RefundStatus.FAILED
      refund.metadata = {
        ...refund.metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorTimestamp: new Date()
      }

      await this.refundRepository.save(refund)
      refundLogger.error(
        {
          refundId: refund.id,
          paymentId: payment.id,
          error
        },
        'Refund processing failed'
      )

      throw error
    }
  }

  // Validate refund eligibility
  private async validateRefundEligibility(
    payment: Payment,
    refundAmount: number
  ): Promise<void> {
    // Check if payment is in refundable state
    if (!payment.canBeRefunded()) {
      throw new Error(
        `Payment ${payment.id} cannot be refunded. Status: ${payment.status}, Method: ${payment.paymentMethodId}`
      )
    }

    // Check if refund amount is valid
    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than 0')
    }

    // Check if refund amount is available
    const availableAmount = payment.getRefundableAmount()
    if (refundAmount > availableAmount) {
      throw new Error(
        `Refund amount ${refundAmount} exceeds available amount ${availableAmount}`
      )
    }

    // Check if payment method supports refunds
    if (payment.paymentMethodId === 'COD') {
      throw new Error('Cash on Delivery payments cannot be refunded electronically')
    }
  }

  // Get refund by ID
  async getRefundById(id: string): Promise<Refund | null> {
    return this.refundRepository.findOne({
      where: { id },
      relations: ['payment']
    })
  }

  // Get refunds by payment ID
  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { paymentId },
      relations: ['payment']
    })
  }

  // Get refund history for a customer
  async getCustomerRefundHistory(
    customerId: string,
    options: {
      status?: RefundStatus
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ refunds: Refund[]; total: number }> {
    const query = this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .where('payment.customerId = :customerId', { customerId })
      .leftJoinAndSelect('refund.payment', 'paymentDetails')

    if (options.status) {
      query.andWhere('refund.status = :status', { status: options.status })
    }

    const [refunds, total] = await query
      .take(options.limit || 10)
      .skip(options.offset || 0)
      .getManyAndCount()

    return { refunds, total }
  }

  // Update refund status (for manual/admin operations)
  async updateRefundStatus(
    id: string,
    status: RefundStatus,
    metadata?: Record<string, unknown>
  ): Promise<Refund> {
    const refund = await this.getRefundById(id)
    if (!refund) {
      throw new Error('Refund not found')
    }

    refund.status = status
    if (metadata) {
      refund.metadata = {
        ...refund.metadata,
        ...metadata,
        statusUpdateTimestamp: new Date()
      }
    }

    await this.refundRepository.save(refund)
    refundLogger.info(
      {
        refundId: refund.id,
        paymentId: refund.paymentId,
        oldStatus: refund.status,
        newStatus: status
      },
      'Refund status updated'
    )

    return refund
  }

  // Get refund statistics
  async getRefundStats(customerId?: string): Promise<{
    totalRefunded: number
    pendingRefunds: number
    refundCount: number
    averageRefundAmount: number
  }> {
    const query = this.refundRepository
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')

    if (customerId) {
      query.where('payment.customerId = :customerId', { customerId })
    }

    const refunds = await query.getMany()

    const stats = {
      totalRefunded: 0,
      pendingRefunds: 0,
      refundCount: refunds.length,
      averageRefundAmount: 0
    }

    refunds.forEach(refund => {
      if (refund.status === RefundStatus.COMPLETED) {
        stats.totalRefunded += Number(refund.amount)
      } else if (refund.status === RefundStatus.PENDING) {
        stats.pendingRefunds += Number(refund.amount)
      }
    })

    stats.averageRefundAmount = stats.refundCount > 0
      ? stats.totalRefunded / stats.refundCount
      : 0

    return stats
  }
} 