/**
 * Enum for notification event types
 */
export enum NotificationEvents {
  // Customer notifications
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELED = 'ORDER_CANCELED',
  SHIPPING_UPDATE = 'SHIPPING_UPDATE',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  
  // Account notifications
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  
  // Marketing notifications
  ABANDONED_CART = 'ABANDONED_CART',
  BACK_IN_STOCK = 'BACK_IN_STOCK',
  PRICE_DROP = 'PRICE_DROP',
  PROMOTIONAL_OFFER = 'PROMOTIONAL_OFFER',
  
  // Admin/staff notifications
  INVENTORY_ALERT = 'INVENTORY_ALERT',
  NEW_ORDER_ALERT = 'NEW_ORDER_ALERT',
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

/**
 * Map of notification types to user-friendly names
 */
export const NotificationNames: Record<NotificationEvents, string> = {
  [NotificationEvents.ORDER_CONFIRMED]: 'Order Confirmation',
  [NotificationEvents.ORDER_SHIPPED]: 'Order Shipped',
  [NotificationEvents.ORDER_DELIVERED]: 'Order Delivered',
  [NotificationEvents.ORDER_CANCELED]: 'Order Canceled',
  [NotificationEvents.SHIPPING_UPDATE]: 'Shipping Update',
  [NotificationEvents.PAYMENT_SUCCESSFUL]: 'Payment Successful',
  [NotificationEvents.PAYMENT_FAILED]: 'Payment Failed',
  [NotificationEvents.REFUND_PROCESSED]: 'Refund Processed',
  [NotificationEvents.REVIEW_REQUESTED]: 'Review Requested',
  
  [NotificationEvents.ACCOUNT_CREATED]: 'Account Created',
  [NotificationEvents.ACCOUNT_VERIFICATION]: 'Account Verification',
  [NotificationEvents.PASSWORD_RESET]: 'Password Reset',
  [NotificationEvents.PASSWORD_CHANGED]: 'Password Changed',
  [NotificationEvents.PROFILE_UPDATED]: 'Profile Updated',
  
  [NotificationEvents.ABANDONED_CART]: 'Abandoned Cart Reminder',
  [NotificationEvents.BACK_IN_STOCK]: 'Back In Stock',
  [NotificationEvents.PRICE_DROP]: 'Price Drop Alert',
  [NotificationEvents.PROMOTIONAL_OFFER]: 'Promotional Offer',
  
  [NotificationEvents.INVENTORY_ALERT]: 'Inventory Alert',
  [NotificationEvents.NEW_ORDER_ALERT]: 'New Order Alert',
  [NotificationEvents.SUPPORT_REQUEST]: 'Support Request',
  [NotificationEvents.SYSTEM_ALERT]: 'System Alert'
}; 