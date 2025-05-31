import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WishlistController } from '../controllers/wishlist.controller';
import { WishlistService } from '../services/wishlist.service';
import { Wishlist } from '../entities/Wishlist';

// Mock the wishlist service
vi.mock('../services/wishlist.service', () => {
  return {
    WishlistService: vi.fn().mockImplementation(() => ({
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      getWishlist: vi.fn(),
      isInWishlist: vi.fn(),
      getWishlistItemById: vi.fn(),
      clearWishlist: vi.fn(),
      countWishlistItems: vi.fn()
    }))
  };
});

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('WishlistController', () => {
  let controller: WishlistController;
  let mockService: WishlistService;
  let mockReply: any;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const productId = '223e4567-e89b-12d3-a456-426614174001';
  const wishlistItemId = '423e4567-e89b-12d3-a456-426614174003';

  beforeEach(() => {
    controller = new WishlistController();
    mockService = (controller as any).wishlistService;
    
    // Create a mock reply object
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    vi.clearAllMocks();
  });

  describe('addToWishlist', () => {
    it('should add a product to the wishlist and return 201 status', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        body: {
          productId,
          productName: 'Test Product',
          productImage: 'test-image.jpg',
          price: 99.99,
          metadata: { color: 'blue' }
        }
      };

      // Create a mock wishlist item
      const mockWishlistItem = new Wishlist();
      mockWishlistItem.id = wishlistItemId;
      mockWishlistItem.userId = userId;
      mockWishlistItem.productId = productId;
      mockWishlistItem.productName = 'Test Product';
      mockWishlistItem.productImage = 'test-image.jpg';
      mockWishlistItem.price = 99.99;
      mockWishlistItem.metadata = { color: 'blue' };

      // Mock the service method
      mockService.addToWishlist.mockResolvedValueOnce(mockWishlistItem);

      // Call the controller method
      await controller.addToWishlist(mockRequest as any, mockReply);

      // Verify the service was called with correct parameters
      expect(mockService.addToWishlist).toHaveBeenCalledWith({
        userId,
        productId,
        productName: 'Test Product',
        productImage: 'test-image.jpg',
        price: 99.99,
        metadata: { color: 'blue' }
      });

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Product added to wishlist',
        data: mockWishlistItem
      });
    });

    it('should handle errors and return 500 status', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        body: { productId }
      };

      // Mock the service method to throw an error
      mockService.addToWishlist.mockRejectedValueOnce(new Error('Service error'));

      // Call the controller method
      await controller.addToWishlist(mockRequest as any, mockReply);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Failed to add product to wishlist',
        error: 'WISHLIST_ADD_FAILED'
      });
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove a product from the wishlist and return 200 status', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        params: { id: wishlistItemId }
      };

      // Create a mock wishlist item
      const mockWishlistItem = new Wishlist();
      mockWishlistItem.id = wishlistItemId;
      mockWishlistItem.userId = userId;
      mockWishlistItem.productId = productId;

      // Mock the service methods
      mockService.getWishlistItemById.mockResolvedValueOnce(mockWishlistItem);
      mockService.removeFromWishlist.mockResolvedValueOnce(true);

      // Call the controller method
      await controller.removeFromWishlist(mockRequest as any, mockReply);

      // Verify the service was called with correct parameters
      expect(mockService.getWishlistItemById).toHaveBeenCalledWith(wishlistItemId, userId);
      expect(mockService.removeFromWishlist).toHaveBeenCalledWith(userId, productId, undefined);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Product removed from wishlist',
        data: { id: wishlistItemId }
      });
    });

    it('should return 404 if wishlist item not found', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        params: { id: wishlistItemId }
      };

      // Mock the service method to return null (item not found)
      mockService.getWishlistItemById.mockResolvedValueOnce(null);

      // Call the controller method
      await controller.removeFromWishlist(mockRequest as any, mockReply);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Wishlist item not found',
        error: 'WISHLIST_ITEM_NOT_FOUND'
      });
    });

    it('should handle errors and return 500 status', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        params: { id: wishlistItemId }
      };

      // Mock the service method to throw an error
      mockService.getWishlistItemById.mockRejectedValueOnce(new Error('Service error'));

      // Call the controller method
      await controller.removeFromWishlist(mockRequest as any, mockReply);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Failed to remove product from wishlist',
        error: 'WISHLIST_REMOVE_FAILED'
      });
    });
  });

  describe('getWishlist', () => {
    it('should return the user\'s wishlist with pagination', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        query: {
          page: '2',
          limit: '5',
          sortBy: 'productName',
          order: 'ASC'
        }
      };

      // Create mock wishlist items
      const mockWishlistItems = [
        { id: '1', productName: 'Product A' },
        { id: '2', productName: 'Product B' }
      ];

      // Mock the service method
      mockService.getWishlist.mockResolvedValueOnce([mockWishlistItems, 10]);

      // Call the controller method
      await controller.getWishlist(mockRequest as any, mockReply);

      // Verify the service was called with correct parameters
      expect(mockService.getWishlist).toHaveBeenCalledWith(userId, {
        page: 2,
        limit: 5,
        sortBy: 'productName',
        order: 'ASC'
      });

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Wishlist retrieved successfully',
        data: {
          items: mockWishlistItems,
          pagination: {
            page: 2,
            limit: 5,
            total: 10,
            pages: 2
          }
        }
      });
    });

    it('should use default pagination values if not provided', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        query: {}
      };

      // Mock the service method
      mockService.getWishlist.mockResolvedValueOnce([[], 0]);

      // Call the controller method
      await controller.getWishlist(mockRequest as any, mockReply);

      // Verify the service was called with default parameters
      expect(mockService.getWishlist).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 20
      });
    });

    it('should handle errors and return 500 status', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        query: {}
      };

      // Mock the service method to throw an error
      mockService.getWishlist.mockRejectedValueOnce(new Error('Service error'));

      // Call the controller method
      await controller.getWishlist(mockRequest as any, mockReply);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Failed to retrieve wishlist',
        error: 'WISHLIST_RETRIEVAL_FAILED'
      });
    });
  });

  describe('checkWishlistItem', () => {
    it('should check if a product is in the wishlist', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        query: {
          productId
        }
      };

      // Create a mock wishlist item
      const mockWishlistItem = new Wishlist();
      mockWishlistItem.id = wishlistItemId;
      mockWishlistItem.userId = userId;
      mockWishlistItem.productId = productId;

      // Mock the service method
      mockService.isInWishlist.mockResolvedValueOnce(mockWishlistItem);

      // Call the controller method
      await controller.checkWishlistItem(mockRequest as any, mockReply);

      // Verify the service was called with correct parameters
      expect(mockService.isInWishlist).toHaveBeenCalledWith(userId, productId, undefined);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Wishlist check completed',
        data: {
          inWishlist: true,
          item: mockWishlistItem
        }
      });
    });

    it('should return inWishlist=false if product is not in wishlist', async () => {
      // Create a mock request
      const mockRequest = {
        user: { id: userId },
        query: {
          productId
        }
      };

      // Mock the service method to return null (item not in wishlist)
      mockService.isInWishlist.mockResolvedValueOnce(null);

      // Call the controller method
      await controller.checkWishlistItem(mockRequest as any, mockReply);

      // Verify the response
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Wishlist check completed',
        data: {
          inWishlist: false,
          item: null
        }
      });
    });
  });
}); 