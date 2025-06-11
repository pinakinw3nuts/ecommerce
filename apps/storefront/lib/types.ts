/**
 * Product related types
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  rating: number;
  numReviews: number;
  reviewCount?: number; // Legacy field, prefer numReviews
  inStock: boolean;
  stockQuantity?: number;
  colors?: string[];
  sizes?: string[];
  features?: string[];
  specifications?: Specification[];
  sku?: string;
  brand?: string;
  category?: string;
  tags?: string[];
  freeShipping?: boolean;
  estimatedDelivery?: string;
  topSeller?: boolean;
  weight?: string;
  dimensions?: string;
  material?: string;
}

export interface RelatedProduct {
  id: string;
  productId: string;
  title: string;
  price: string;
  imageUrl: string;
  rating: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful?: number;
  images?: string[];
  response?: {
    from: string;
    comment: string;
    date: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId?: string;
  featured?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  products: Product[];
}

export interface SEO {
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  slug: string;
}

export interface Specification {
  name: string;
  value: string;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'cart' | 'wishlist';
  duration?: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variant?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface SearchFilter {
  priceRange?: {
    min: number;
    max: number;
  };
  categories?: string[];
  brands?: string[];
  ratings?: number[];
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  freeShipping?: boolean;
  onSale?: boolean;
} 