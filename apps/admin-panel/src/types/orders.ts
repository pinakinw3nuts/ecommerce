export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
  name: string;
  image: string;
  sku: string;
  additionalImages?: string[];
  variantName?: string;
  description?: string;
  originalPrice?: number;
  salePrice?: number;
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  slug?: string;
  metadata?: {
    [key: string]: any;
  };
  orderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  authorId: string;
  authorName?: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  shippingCarrier?: string;
  items: OrderItem[];
  notes?: OrderNote[];
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationData;
}