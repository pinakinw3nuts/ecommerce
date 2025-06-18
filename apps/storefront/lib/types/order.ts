export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  sku?: string;
  status?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}
