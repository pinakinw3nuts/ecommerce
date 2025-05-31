/**
 * Notification Event Types
 * 
 * This file defines all notification events that can be triggered in the system.
 * Each constant represents a specific event that may require a notification.
 */

// ===== USER ACCOUNT EVENTS =====
/** Sent when a new user creates an account */
export const USER_REGISTERED = 'USER_REGISTERED';

/** Sent to verify a user's email address */
export const EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

/** Sent when a user requests a password reset */
export const PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED';

/** Sent when a user's password has been changed */
export const PASSWORD_CHANGED = 'PASSWORD_CHANGED';

/** Sent when a user's account information is updated */
export const ACCOUNT_UPDATED = 'ACCOUNT_UPDATED';

/** Sent when suspicious activity is detected on a user account */
export const SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY';

// ===== ORDER EVENTS =====
/** Sent when an order is placed */
export const ORDER_CREATED = 'ORDER_CREATED';

/** Sent when an order is confirmed */
export const ORDER_CONFIRMED = 'ORDER_CONFIRMED';

/** Sent when an order payment is processed */
export const PAYMENT_PROCESSED = 'PAYMENT_PROCESSED';

/** Sent when an order has been shipped */
export const ORDER_SHIPPED = 'ORDER_SHIPPED';

/** Sent when an order's delivery status changes */
export const DELIVERY_STATUS_UPDATED = 'DELIVERY_STATUS_UPDATED';

/** Sent when an order has been delivered */
export const ORDER_DELIVERED = 'ORDER_DELIVERED';

/** Sent when an order is canceled */
export const ORDER_CANCELED = 'ORDER_CANCELED';

/** Sent when a refund is processed */
export const REFUND_PROCESSED = 'REFUND_PROCESSED';

// ===== PRODUCT EVENTS =====
/** Sent when a product's price changes */
export const PRICE_CHANGED = 'PRICE_CHANGED';

/** Sent when a product is back in stock */
export const PRODUCT_BACK_IN_STOCK = 'PRODUCT_BACK_IN_STOCK';

/** Sent when a product's stock is low */
export const LOW_STOCK_ALERT = 'LOW_STOCK_ALERT';

/** Sent when a product goes out of stock */
export const OUT_OF_STOCK = 'OUT_OF_STOCK';

/** Sent when a product has been added to the user's wishlist */
export const PRODUCT_ADDED_TO_WISHLIST = 'PRODUCT_ADDED_TO_WISHLIST';

// ===== REVIEW EVENTS =====
/** Sent to request a product review */
export const REVIEW_REQUESTED = 'REVIEW_REQUESTED';

/** Sent when a review is published */
export const REVIEW_PUBLISHED = 'REVIEW_PUBLISHED';

/** Sent when someone responds to a user's review */
export const REVIEW_RESPONSE = 'REVIEW_RESPONSE';

// ===== MARKETING EVENTS =====
/** Sent for promotional campaigns */
export const PROMOTIONAL_CAMPAIGN = 'PROMOTIONAL_CAMPAIGN';

/** Sent for seasonal sales announcements */
export const SEASONAL_SALE = 'SEASONAL_SALE';

/** Sent for abandoned cart reminders */
export const ABANDONED_CART = 'ABANDONED_CART';

// ===== ADMINISTRATIVE EVENTS =====
/** Sent for critical system alerts */
export const SYSTEM_CRITICAL_ALERT = 'SYSTEM_CRITICAL_ALERT';

/** Sent for system maintenance notifications */
export const SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE';

/** Sent for payment gateway issues */
export const PAYMENT_GATEWAY_ISSUE = 'PAYMENT_GATEWAY_ISSUE';

/** Sent for unusual or high-volume order patterns */
export const UNUSUAL_ORDER_ACTIVITY = 'UNUSUAL_ORDER_ACTIVITY';

/** Sent for inventory discrepancies */
export const INVENTORY_DISCREPANCY = 'INVENTORY_DISCREPANCY';

// Group related events by category for easier imports
export const UserEvents = {
  USER_REGISTERED,
  EMAIL_VERIFICATION,
  PASSWORD_RESET_REQUESTED,
  PASSWORD_CHANGED,
  ACCOUNT_UPDATED,
  SUSPICIOUS_ACTIVITY
};

export const OrderEvents = {
  ORDER_CREATED,
  ORDER_CONFIRMED,
  PAYMENT_PROCESSED,
  ORDER_SHIPPED,
  DELIVERY_STATUS_UPDATED,
  ORDER_DELIVERED,
  ORDER_CANCELED,
  REFUND_PROCESSED
};

export const ProductEvents = {
  PRICE_CHANGED,
  PRODUCT_BACK_IN_STOCK,
  LOW_STOCK_ALERT,
  OUT_OF_STOCK,
  PRODUCT_ADDED_TO_WISHLIST
};

export const ReviewEvents = {
  REVIEW_REQUESTED,
  REVIEW_PUBLISHED,
  REVIEW_RESPONSE
};

export const MarketingEvents = {
  PROMOTIONAL_CAMPAIGN,
  SEASONAL_SALE,
  ABANDONED_CART
};

export const AdminEvents = {
  SYSTEM_CRITICAL_ALERT,
  SYSTEM_MAINTENANCE,
  PAYMENT_GATEWAY_ISSUE,
  UNUSUAL_ORDER_ACTIVITY,
  INVENTORY_DISCREPANCY
};

// Export all event types in a single object
export const NotificationEvents = {
  ...UserEvents,
  ...OrderEvents,
  ...ProductEvents,
  ...ReviewEvents,
  ...MarketingEvents,
  ...AdminEvents
}; 