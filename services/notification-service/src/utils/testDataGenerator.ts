/**
 * Utility for generating test data for various notification types
 */

import { NotificationEvents } from '../constants';

/**
 * Generate test data for various notification types
 */
export function generateTestData(type: string): Record<string, any> {
  switch (type) {
    case NotificationEvents.ORDER_CONFIRMED:
      return {
        orderNumber: 'TEST-1234',
        name: 'Test Customer',
        orderDate: new Date().toISOString().split('T')[0],
        orderTotal: 129.99,
        currency: '$',
        items: [
          { name: 'Test Product 1', quantity: 2, price: 49.99 },
          { name: 'Test Product 2', quantity: 1, price: 30.01 }
        ],
        orderUrl: 'https://example.com/orders/TEST-1234'
      };
      
    case NotificationEvents.SHIPPING_UPDATE:
      return {
        orderNumber: 'TEST-1234',
        name: 'Test Customer',
        status: 'Shipped',
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://example.com/track/TRK123456789',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
    case NotificationEvents.PASSWORD_RESET:
      return {
        resetUrl: 'https://example.com/reset-password?token=test-token',
        expiresInHours: 24
      };
      
    case NotificationEvents.ACCOUNT_VERIFICATION:
      return {
        name: 'Test Customer',
        verificationUrl: 'https://example.com/verify?token=test-token',
        expiresInHours: 48
      };
      
    case NotificationEvents.INVENTORY_ALERT:
      return {
        productName: 'Test Product',
        sku: 'SKU-TEST-123',
        currentStock: 3,
        threshold: 5,
        warehouseName: 'Main Warehouse',
        restockEta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
    case NotificationEvents.PRICE_DROP:
      return {
        productName: 'Test Product',
        sku: 'SKU-TEST-123',
        oldPrice: 99.99,
        newPrice: 79.99,
        currency: '$',
        discountPercentage: 20,
        productUrl: 'https://example.com/products/test-product'
      };
      
    case NotificationEvents.BACK_IN_STOCK:
      return {
        productName: 'Test Product',
        sku: 'SKU-TEST-123',
        productUrl: 'https://example.com/products/test-product',
        quantityAvailable: 10,
        price: 49.99,
        currency: '$'
      };
      
    case NotificationEvents.ORDER_CANCELED:
      return {
        orderNumber: 'TEST-1234',
        name: 'Test Customer',
        cancelDate: new Date().toISOString().split('T')[0],
        refundAmount: 129.99,
        currency: '$',
        reason: 'Customer request',
        supportContact: 'support@example.com'
      };
      
    case NotificationEvents.PAYMENT_FAILED:
      return {
        orderNumber: 'TEST-1234',
        name: 'Test Customer',
        amount: 129.99,
        currency: '$',
        paymentMethod: 'Credit Card',
        reason: 'Insufficient funds',
        retryUrl: 'https://example.com/orders/TEST-1234/payment'
      };
      
    case NotificationEvents.REVIEW_REQUESTED:
      return {
        orderNumber: 'TEST-1234',
        name: 'Test Customer',
        purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        products: [
          { name: 'Test Product 1', imageUrl: 'https://example.com/images/product1.jpg' },
          { name: 'Test Product 2', imageUrl: 'https://example.com/images/product2.jpg' }
        ],
        reviewUrl: 'https://example.com/review/TEST-1234'
      };
      
    // Add test data for other notification types as needed
    
    default:
      // Generic test data for other notification types
      return {
        name: 'Test Customer',
        message: `This is a test ${type} notification`,
        timestamp: new Date().toISOString(),
        testData: true
      };
  }
} 