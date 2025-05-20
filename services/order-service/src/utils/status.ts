/**
 * Enum representing the possible states of an order
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

/**
 * Type guard to check if a string is a valid OrderStatus
 */
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(OrderStatus).includes(status as OrderStatus);
};

/**
 * Final states that an order can be in (no further transitions possible)
 */
export const FINAL_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
] as const;

/**
 * States where the order can still be cancelled
 */
export const CANCELLABLE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
] as const;

/**
 * Types for status groups
 */
export type FinalStatus = typeof FINAL_STATUSES[number];
export type CancellableStatus = typeof CANCELLABLE_STATUSES[number];

/**
 * Valid status transitions map
 * Key: current status
 * Value: array of valid next statuses
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]: [], // Final state
  [OrderStatus.CANCELLED]: [], // Final state
  [OrderStatus.FAILED]: [], // Final state
} as const;

/**
 * Check if a status transition is valid
 */
export const isValidStatusTransition = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};

/**
 * Check if an order status is final (no further transitions possible)
 */
export const isFinalStatus = (status: OrderStatus): status is FinalStatus => {
  return (FINAL_STATUSES as readonly OrderStatus[]).includes(status);
};

/**
 * Check if an order can be cancelled from its current status
 */
export const isOrderCancellable = (status: OrderStatus): status is CancellableStatus => {
  return (CANCELLABLE_STATUSES as readonly OrderStatus[]).includes(status);
}; 