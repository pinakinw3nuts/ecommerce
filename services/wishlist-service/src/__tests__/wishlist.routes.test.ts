import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { wishlistRoutes } from '../routes/wishlist.routes';
import { WishlistController } from '../controllers/wishlist.controller';

// Mock the wishlist controller
vi.mock('../controllers/wishlist.controller', () => {
  return {
    WishlistController: vi.fn().mockImplementation(() => ({
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      getWishlist: vi.fn(),
      checkWishlistItem: vi.fn(),
      clearWishlist: vi.fn(),
      getWishlistCount: vi.fn()
    }))
  };
});

// Mock the auth middleware
vi.mock('../middleware/authGuard', () => ({
  authGuard: vi.fn((req, reply, done) => {
    req.user = { id: 'test-user-id', role: 'buyer' };
    done();
  })
}));

// Mock the role middleware
vi.mock('../middleware/roleGuard', () => ({
  roleGuard: vi.fn((roles) => (req, reply, done) => {
    done();
  })
}));

// Mock the validation middleware
vi.mock('../middleware/validateRequest', () => ({
  validateRequest: vi.fn(() => (req, reply, done) => {
    done();
  })
}));

describe('Wishlist Routes', () => {
  let app: FastifyInstance;
  let mockController: WishlistController;

  beforeEach(async () => {
    // Create a new Fastify instance for each test
    app = Fastify();
    
    // Register the routes
    app.register(wishlistRoutes);
    
    // Wait for the app to be ready
    await app.ready();
    
    // Get the mock controller instance
    mockController = (WishlistController as any).mock.instances[0];
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Close the app after each test
    app.close();
  });

  describe('POST /wishlist', () => {
    it('should call the controller addToWishlist method', async () => {
      // Prepare the request payload
      const payload = {
        productId: '123',
        productName: 'Test Product',
        price: 99.99
      };

      // Mock the controller method
      mockController.addToWishlist.mockImplementation((req, reply) => {
        reply.status(201).send({ message: 'Product added to wishlist' });
      });

      // Make the request
      const response = await app.inject({
        method: 'POST',
        url: '/wishlist',
        payload
      });

      // Verify the controller method was called
      expect(mockController.addToWishlist).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Product added to wishlist'
      });
    });
  });

  describe('DELETE /wishlist/:id', () => {
    it('should call the controller removeFromWishlist method', async () => {
      // Mock the controller method
      mockController.removeFromWishlist.mockImplementation((req, reply) => {
        reply.status(200).send({ message: 'Product removed from wishlist' });
      });

      // Make the request
      const response = await app.inject({
        method: 'DELETE',
        url: '/wishlist/123'
      });

      // Verify the controller method was called
      expect(mockController.removeFromWishlist).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Product removed from wishlist'
      });
    });
  });

  describe('GET /wishlist', () => {
    it('should call the controller getWishlist method', async () => {
      // Mock the controller method
      mockController.getWishlist.mockImplementation((req, reply) => {
        reply.status(200).send({
          message: 'Wishlist retrieved successfully',
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0
            }
          }
        });
      });

      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/wishlist'
      });

      // Verify the controller method was called
      expect(mockController.getWishlist).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Wishlist retrieved successfully',
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
          }
        }
      });
    });

    it('should pass query parameters to the controller', async () => {
      // Mock the controller method
      mockController.getWishlist.mockImplementation((req, reply) => {
        reply.status(200).send({
          message: 'Wishlist retrieved successfully',
          data: {
            items: [],
            pagination: {
              page: 2,
              limit: 5,
              total: 0,
              pages: 0
            }
          }
        });
      });

      // Make the request with query parameters
      const response = await app.inject({
        method: 'GET',
        url: '/wishlist?page=2&limit=5&sortBy=productName&order=ASC'
      });

      // Verify the controller method was called
      expect(mockController.getWishlist).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /wishlist/check', () => {
    it('should call the controller checkWishlistItem method', async () => {
      // Mock the controller method
      mockController.checkWishlistItem.mockImplementation((req, reply) => {
        reply.status(200).send({
          message: 'Wishlist check completed',
          data: {
            inWishlist: false,
            item: null
          }
        });
      });

      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/wishlist/check?productId=123'
      });

      // Verify the controller method was called
      expect(mockController.checkWishlistItem).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Wishlist check completed',
        data: {
          inWishlist: false,
          item: null
        }
      });
    });
  });

  describe('DELETE /wishlist', () => {
    it('should call the controller clearWishlist method', async () => {
      // Mock the controller method
      mockController.clearWishlist.mockImplementation((req, reply) => {
        reply.status(200).send({ message: 'Wishlist cleared successfully' });
      });

      // Make the request
      const response = await app.inject({
        method: 'DELETE',
        url: '/wishlist'
      });

      // Verify the controller method was called
      expect(mockController.clearWishlist).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Wishlist cleared successfully'
      });
    });
  });

  describe('GET /wishlist/count', () => {
    it('should call the controller getWishlistCount method', async () => {
      // Mock the controller method
      mockController.getWishlistCount.mockImplementation((req, reply) => {
        reply.status(200).send({
          message: 'Wishlist count retrieved',
          data: { count: 5 }
        });
      });

      // Make the request
      const response = await app.inject({
        method: 'GET',
        url: '/wishlist/count'
      });

      // Verify the controller method was called
      expect(mockController.getWishlistCount).toHaveBeenCalled();
      
      // Verify the response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Wishlist count retrieved',
        data: { count: 5 }
      });
    });
  });
}); 