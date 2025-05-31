export * from './notificationEvents';

// Notification channels
export const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  LOG: 'log'
} as const;

// Notification priorities
export const PRIORITIES = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
} as const;

// Template IDs - to match with template implementation functions
export const TEMPLATES = {
  ORDER_CONFIRMATION: 'order-confirmation',
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  SHIPPING_UPDATE: 'shipping-update',
  ADMIN_ALERT: 'admin-alert',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  PRODUCT_REVIEW_REQUEST: 'product-review-request',
  PRICE_DROP_ALERT: 'price-drop-alert',
  BACK_IN_STOCK: 'back-in-stock',
  ABANDONED_CART: 'abandoned-cart'
} as const; 