import { randomUUID } from 'crypto'

// Payment method types
export enum PaymentMethod {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  COD = 'cod',
  INVOICE = 'invoice'
}

// Payment status types
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Common payment response interface
export interface PaymentResponse {
  success: boolean
  transactionId: string
  status: PaymentStatus
  message: string
  gateway: PaymentMethod
  metadata: Record<string, unknown>
  timestamp: Date
}

// Payment request interface
export interface PaymentRequest {
  amount: number
  currency: string
  orderId: string
  customerId: string
  metadata?: Record<string, unknown>
  shouldFail?: boolean // For testing failure scenarios
}

// Mock gateway response generator
const createMockResponse = (
  gateway: PaymentMethod,
  success: boolean,
  request: PaymentRequest
): PaymentResponse => {
  const status = success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED
  
  return {
    success,
    transactionId: randomUUID(),
    status,
    message: success ? 'Payment processed successfully' : 'Payment processing failed',
    gateway,
    metadata: {
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency,
      ...request.metadata
    },
    timestamp: new Date()
  }
}

// Simulate processing delay
const simulateProcessing = async (ms: number = 1000): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

// Mock Stripe payment processing
export const processStripePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await simulateProcessing()
  return createMockResponse(
    PaymentMethod.STRIPE,
    !request.shouldFail,
    request
  )
}

// Mock Razorpay payment processing
export const processRazorpayPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await simulateProcessing()
  return createMockResponse(
    PaymentMethod.RAZORPAY,
    !request.shouldFail,
    request
  )
}

// Mock COD payment processing
export const processCODPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await simulateProcessing(500) // Faster processing for COD
  return createMockResponse(
    PaymentMethod.COD,
    true, // COD always succeeds initially
    {
      ...request,
      metadata: {
        ...request.metadata,
        codStatus: 'pending_delivery',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    }
  )
}

// Mock Invoice payment processing
export const processInvoicePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  await simulateProcessing(800)
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  
  return createMockResponse(
    PaymentMethod.INVOICE,
    true, // Invoice generation always succeeds
    {
      ...request,
      metadata: {
        ...request.metadata,
        invoiceNumber: `INV-${Date.now()}`,
        dueDate,
        paymentTerms: 'NET30',
        invoiceStatus: 'issued'
      }
    }
  )
}

// Mock refund processing
export const processRefund = async (
  transactionId: string,
  amount: number,
  reason: string
): Promise<PaymentResponse> => {
  await simulateProcessing(1500) // Refunds take longer
  
  return {
    success: true,
    transactionId: randomUUID(),
    status: PaymentStatus.REFUNDED,
    message: 'Refund processed successfully',
    gateway: PaymentMethod.STRIPE, // Assuming original payment gateway
    metadata: {
      originalTransactionId: transactionId,
      refundAmount: amount,
      refundReason: reason,
      refundInitiatedAt: new Date()
    },
    timestamp: new Date()
  }
}

// Gateway factory
export const PaymentGateway = {
  stripe: processStripePayment,
  razorpay: processRazorpayPayment,
  cod: processCODPayment,
  invoice: processInvoicePayment,
  refund: processRefund
}

export default PaymentGateway 