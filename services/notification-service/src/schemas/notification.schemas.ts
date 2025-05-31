import { z } from 'zod';
import { NotificationEvents } from '../constants';

/**
 * Base schema for all notification requests
 */
export const baseNotificationSchema = z.object({
  type: z.nativeEnum(NotificationEvents),
  recipients: z.array(z.string().email()).min(1),
  data: z.record(z.any()),
  channel: z.enum(['email', 'sms', 'push', 'all']).default('email'),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  scheduledTime: z.string().datetime().optional()
});

/**
 * Schema for job ID parameter
 */
export const notificationJobIdSchema = z.object({
  jobId: z.string().min(1)
});

/**
 * Schema for ORDER_CONFIRMED notification
 */
export const orderConfirmedSchema = baseNotificationSchema.extend({
  type: z.literal(NotificationEvents.ORDER_CONFIRMED),
  data: z.object({
    orderNumber: z.string(),
    name: z.string(),
    orderDate: z.string(),
    orderTotal: z.number(),
    currency: z.string().default('$'),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number()
    })),
    orderUrl: z.string().url()
  })
});

/**
 * Schema for SHIPPING_UPDATE notification
 */
export const shippingUpdateSchema = baseNotificationSchema.extend({
  type: z.literal(NotificationEvents.SHIPPING_UPDATE),
  data: z.object({
    orderNumber: z.string(),
    name: z.string(),
    status: z.string(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    estimatedDelivery: z.string().optional()
  })
});

/**
 * Schema for PASSWORD_RESET notification
 */
export const passwordResetSchema = baseNotificationSchema.extend({
  type: z.literal(NotificationEvents.PASSWORD_RESET),
  data: z.object({
    resetUrl: z.string().url(),
    expiresInHours: z.number().default(24)
  })
});

/**
 * Schema for ACCOUNT_VERIFICATION notification
 */
export const accountVerificationSchema = baseNotificationSchema.extend({
  type: z.literal(NotificationEvents.ACCOUNT_VERIFICATION),
  data: z.object({
    name: z.string(),
    verificationUrl: z.string().url(),
    expiresInHours: z.number().default(24)
  })
});

/**
 * Schema for INVENTORY_ALERT notification
 */
export const inventoryAlertSchema = baseNotificationSchema.extend({
  type: z.literal(NotificationEvents.INVENTORY_ALERT),
  data: z.object({
    productName: z.string(),
    sku: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    warehouseName: z.string().optional(),
    restockEta: z.string().optional()
  })
});

/**
 * Map of notification schemas by type
 */
export const notificationSchemas: Record<NotificationEvents, z.ZodTypeAny> = {
  [NotificationEvents.ORDER_CONFIRMED]: orderConfirmedSchema,
  [NotificationEvents.SHIPPING_UPDATE]: shippingUpdateSchema,
  [NotificationEvents.PASSWORD_RESET]: passwordResetSchema,
  [NotificationEvents.ACCOUNT_VERIFICATION]: accountVerificationSchema,
  [NotificationEvents.INVENTORY_ALERT]: inventoryAlertSchema,
  [NotificationEvents.REVIEW_REQUESTED]: baseNotificationSchema,
  
  // All other notification types use the base schema for now
  [NotificationEvents.ORDER_SHIPPED]: baseNotificationSchema,
  [NotificationEvents.ORDER_DELIVERED]: baseNotificationSchema,
  [NotificationEvents.ORDER_CANCELED]: baseNotificationSchema,
  [NotificationEvents.PAYMENT_SUCCESSFUL]: baseNotificationSchema,
  [NotificationEvents.PAYMENT_FAILED]: baseNotificationSchema,
  [NotificationEvents.REFUND_PROCESSED]: baseNotificationSchema,
  [NotificationEvents.ACCOUNT_CREATED]: baseNotificationSchema,
  [NotificationEvents.PASSWORD_CHANGED]: baseNotificationSchema,
  [NotificationEvents.PROFILE_UPDATED]: baseNotificationSchema,
  [NotificationEvents.ABANDONED_CART]: baseNotificationSchema,
  [NotificationEvents.BACK_IN_STOCK]: baseNotificationSchema,
  [NotificationEvents.PRICE_DROP]: baseNotificationSchema,
  [NotificationEvents.PROMOTIONAL_OFFER]: baseNotificationSchema,
  [NotificationEvents.NEW_ORDER_ALERT]: baseNotificationSchema,
  [NotificationEvents.SUPPORT_REQUEST]: baseNotificationSchema,
  [NotificationEvents.SYSTEM_ALERT]: baseNotificationSchema
};

/**
 * Schema for the test email endpoint
 */
export const testEmailSchema = z.object({
  recipient: z.string().email().describe('Recipient email address'),
  template: z.string().min(1).describe('Template ID to test'),
  data: z.record(z.unknown()).optional().default({}).describe('Test data for template')
});

/**
 * Schema for the test all templates endpoint
 */
export const testAllTemplatesSchema = z.object({
  recipient: z.string().email().describe('Recipient email address for all test emails')
});

/**
 * Schema for the failed notifications endpoint
 */
export const failedNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10)
    .describe('Maximum number of failed notifications to return')
});

/**
 * Type for validated notification payload based on the schema
 */
export type NotificationPayload<T extends keyof typeof notificationSchemas> = 
  z.infer<typeof notificationSchemas[T]>; 