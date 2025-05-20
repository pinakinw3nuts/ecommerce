import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';
import { createTestDatabase, cleanupTestDatabase } from './utils/test-db';
import { generateTestToken } from './utils/auth-helper';

describe('Order Operations', () => {
  let app: FastifyInstance;
  const testUserId = 'user123';
  const adminId = 'admin456';
  
  // Test order data
  const testOrder = {
    items: [
      { productId: 'prod1', quantity: 2, price: 29.99 },
      { productId: 'prod2', quantity: 1, price: 49.99 }
    ],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    totalAmount: 109.97
  };

  beforeEach(async () => {
    await createTestDatabase();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    await cleanupTestDatabase();
  });

  describe('Order Placement', () => {
    test('should successfully create a new order', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: testOrder
      });

      expect(response.statusCode).toBe(201);
      const order = JSON.parse(response.payload);
      expect(order).toMatchObject({
        userId: testUserId,
        status: 'CREATED',
        items: testOrder.items,
        shippingAddress: testOrder.shippingAddress,
        totalAmount: testOrder.totalAmount
      });
    });

    test('should validate required order fields', async () => {
      const invalidOrder = {
        items: [] // Missing required items
      };

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: invalidOrder
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error.message).toContain('validation failed');
    });
  });

  describe('Order Cancellation', () => {
    test('should successfully cancel an order', async () => {
      // First create an order
      const createResponse = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: testOrder
      });
      
      const createdOrder = JSON.parse(createResponse.payload);

      // Then cancel it
      const cancelResponse = await app.inject({
        method: 'PUT',
        url: `/orders/${createdOrder.id}`,
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: {
          status: 'CANCELLED',
          cancellationReason: 'Changed mind'
        }
      });

      expect(cancelResponse.statusCode).toBe(200);
      const cancelledOrder = JSON.parse(cancelResponse.payload);
      expect(cancelledOrder.status).toBe('CANCELLED');
      expect(cancelledOrder.cancellationReason).toBe('Changed mind');
    });

    test('should prevent cancellation of shipped orders', async () => {
      // Create and update order to SHIPPED status (as admin)
      const createResponse = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: testOrder
      });
      
      const createdOrder = JSON.parse(createResponse.payload);

      // Update to SHIPPED (as admin)
      await app.inject({
        method: 'PUT',
        url: `/orders/${createdOrder.id}`,
        headers: {
          'Authorization': `Bearer ${generateTestToken(adminId, true)}`
        },
        payload: {
          status: 'SHIPPED'
        }
      });

      // Attempt to cancel
      const cancelResponse = await app.inject({
        method: 'PUT',
        url: `/orders/${createdOrder.id}`,
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: {
          status: 'CANCELLED'
        }
      });

      expect(cancelResponse.statusCode).toBe(400);
      const error = JSON.parse(cancelResponse.payload);
      expect(error.message).toContain('Cannot cancel shipped order');
    });
  });

  describe('Order History', () => {
    test('should fetch user order history', async () => {
      // Create multiple orders
      await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: testOrder
      });

      await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        },
        payload: { ...testOrder, totalAmount: 59.99 }
      });

      // Fetch order history
      const response = await app.inject({
        method: 'GET',
        url: '/orders',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(200);
      const orders = JSON.parse(response.payload);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(2);
      orders.forEach((order: { userId: string }) => {
        expect(order.userId).toBe(testUserId);
      });
    });

    test('should paginate order history results', async () => {
      // Create multiple orders
      for (let i = 0; i < 15; i++) {
        await app.inject({
          method: 'POST',
          url: '/orders',
          headers: {
            'Authorization': `Bearer ${generateTestToken(testUserId)}`
          },
          payload: testOrder
        });
      }

      // Fetch first page
      const firstPageResponse = await app.inject({
        method: 'GET',
        url: '/orders?page=1&limit=10',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(firstPageResponse.statusCode).toBe(200);
      const firstPage = JSON.parse(firstPageResponse.payload);
      expect(firstPage.orders.length).toBe(10);
      expect(firstPage.pagination.totalPages).toBe(2);
      expect(firstPage.pagination.currentPage).toBe(1);

      // Fetch second page
      const secondPageResponse = await app.inject({
        method: 'GET',
        url: '/orders?page=2&limit=10',
        headers: {
          'Authorization': `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(secondPageResponse.statusCode).toBe(200);
      const secondPage = JSON.parse(secondPageResponse.payload);
      expect(secondPage.orders.length).toBe(5);
      expect(secondPage.pagination.currentPage).toBe(2);
    });
  });
}); 