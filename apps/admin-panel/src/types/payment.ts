// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

// Payment method enum
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay'
}

export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  STORE_CREDIT = 'store_credit',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum PaymentGatewayType {
  DIRECT = 'direct',
  REDIRECT = 'redirect',
  IFRAME = 'iframe',
  OFFLINE = 'offline'
}

// Refund status enum
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  providerMethodId: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  brand: string;
  status: PaymentMethodStatus;
  isDefault: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  transactionId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId: string | null;
  currency: string;
  amount: number;
  providerPaymentId: string | null;
  providerResponse: Record<string, any> | null;
  paymentMethodId: string;
  paymentMethod: PaymentMethod;
  metadata: Record<string, any> | null;
  refunds: Refund[];
  refundedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse {
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentMethodsResponse {
  items: PaymentMethod[];
  pagination: PaginationResponse;
}

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  type: PaymentGatewayType;
  description: string;
  logo: string | null;
  isEnabled: boolean;
  supportedCurrencies: string[];
  minimumAmount: number | null;
  maximumAmount: number | null;
  countries: string[] | null;
  excludedCountries: string[] | null;
  paymentInstructions: string | null;
  transactionFee: number | null;
  transactionFeeType: 'fixed' | 'percentage' | null;
  processingTime: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewaysResponse {
  items: PaymentGateway[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
} 