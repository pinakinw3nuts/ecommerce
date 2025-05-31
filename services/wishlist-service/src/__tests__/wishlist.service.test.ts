import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WishlistService, AddToWishlistDto } from '../services/wishlist.service';
import { Wishlist } from '../entities/Wishlist';

// Mock the TypeORM repository
const mockRepository = {
  findOne: vi.fn(),
  find: vi.fn(),
  findAndCount: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  count: vi.fn()
};

// Mock the database connection
vi.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: () => mockRepository
  }
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('WishlistService', () => {
  let wishlistService: WishlistService;
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const productId = '223e4567-e89b-12d3-a456-426614174001';
  const variantId = '323e4567-e89b-12d3-a456-426614174002';

  beforeEach(() => {
    wishlistService = new WishlistService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addToWishlist', () => {
    it('should add a product to the wishlist if it does not exist', async () => {
      // Mock the findOne method to return null (item not in wishlist)
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Mock the save method to return the saved item
      const savedItem = new Wishlist();
      savedItem.id = '423e4567-e89b-12d3-a456-426614174003';
      savedItem.userId = userId;
      savedItem.productId = productId;
      savedItem.variantId = variantId;
      savedItem.productName = 'Test Product';
      savedItem.productImage = 'test-image.jpg';
      savedItem.price = 99.99;
      savedItem.metadata = { color: 'blue' };
      savedItem.createdAt = new Date();
      savedItem.updatedAt = new Date();
      
      mockRepository.save.mockResolvedValueOnce(savedItem);

      // Create DTO for adding to wishlist
      const dto: AddToWishlistDto = {
        userId,
        productId,
        variantId,
        productName: 'Test Product',
        productImage: 'test-image.jpg',
        price: 99.99,
        metadata: { color: 'blue' }
      };

      // Call the service method
      const result = await wishlistService.addToWishlist(dto);

      // Verify the repository methods were called correctly
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          productId,
          variantId
        }
      });
      
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify the result
      expect(result).toEqual(savedItem);
      expect(result.userId).toBe(userId);
      expect(result.productId).toBe(productId);
      expect(result.variantId).toBe(variantId);
      expect(result.productName).toBe('Test Product');
      expect(result.price).toBe(99.99);
      expect(result.metadata).toEqual({ color: 'blue' });
    });

    it('should return existing item if product is already in wishlist', async () => {
      // Mock the findOne method to return an existing item
      const existingItem = new Wishlist();
      existingItem.id = '423e4567-e89b-12d3-a456-426614174003';
      existingItem.userId = userId;
      existingItem.productId = productId;
      existingItem.variantId = variantId;
      existingItem.productName = 'Test Product';
      existingItem.productImage = 'test-image.jpg';
      existingItem.price = 99.99;
      existingItem.metadata = { color: 'blue' };
      existingItem.createdAt = new Date();
      existingItem.updatedAt = new Date();
      
      mockRepository.findOne.mockResolvedValueOnce(existingItem);

      // Create DTO for adding to wishlist
      const dto: AddToWishlistDto = {
        userId,
        productId,
        variantId,
        productName: 'Test Product Updated', // Different name to verify it's not saved
        productImage: 'test-image-updated.jpg',
        price: 89.99,
        metadata: { color: 'red' }
      };

      // Call the service method
      const result = await wishlistService.addToWishlist(dto);

      // Verify the repository methods were called correctly
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          productId,
          variantId
        }
      });
      
      // Save should not be called
      expect(mockRepository.save).not.toHaveBeenCalled();
      
      // Verify the result is the existing item
      expect(result).toEqual(existingItem);
      expect(result.productName).toBe('Test Product'); // Original name, not updated
      expect(result.price).toBe(99.99); // Original price, not updated
    });

    it('should handle errors when adding to wishlist', async () => {
      // Mock the findOne method to throw an error
      mockRepository.findOne.mockRejectedValueOnce(new Error('Database error'));

      // Create DTO for adding to wishlist
      const dto: AddToWishlistDto = {
        userId,
        productId,
        variantId
      };

      // Call the service method and expect it to throw
      await expect(wishlistService.addToWishlist(dto)).rejects.toThrow('Failed to add product to wishlist');
    });
  });

  describe('getWishlist', () => {
    it('should return paginated wishlist items', async () => {
      // Create mock wishlist items
      const wishlistItems = [
        {
          id: '123',
          userId,
          productId: '1',
          productName: 'Product 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '456',
          userId,
          productId: '2',
          productName: 'Product 2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock the findAndCount method
      mockRepository.findAndCount.mockResolvedValueOnce([wishlistItems, 2]);

      // Call the service method
      const [items, total] = await wishlistService.getWishlist(userId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'DESC'
      });

      // Verify the repository method was called correctly
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: {
          createdAt: 'DESC'
        },
        skip: 0,
        take: 10
      });

      // Verify the result
      expect(items).toEqual(wishlistItems);
      expect(total).toBe(2);
    });

    it('should handle errors when getting wishlist', async () => {
      // Mock the findAndCount method to throw an error
      mockRepository.findAndCount.mockRejectedValueOnce(new Error('Database error'));

      // Call the service method and expect it to throw
      await expect(wishlistService.getWishlist(userId, {
        page: 1,
        limit: 10
      })).rejects.toThrow('Failed to get wishlist');
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove a product from the wishlist', async () => {
      // Mock the delete method to return affected rows
      mockRepository.delete.mockResolvedValueOnce({ affected: 1 });

      // Call the service method
      const result = await wishlistService.removeFromWishlist(userId, productId, variantId);

      // Verify the repository method was called correctly
      expect(mockRepository.delete).toHaveBeenCalledWith({
        userId,
        productId,
        variantId: variantId
      });

      // Verify the result
      expect(result).toBe(true);
    });

    it('should return false if product was not in wishlist', async () => {
      // Mock the delete method to return no affected rows
      mockRepository.delete.mockResolvedValueOnce({ affected: 0 });

      // Call the service method
      const result = await wishlistService.removeFromWishlist(userId, productId);

      // Verify the repository method was called correctly
      expect(mockRepository.delete).toHaveBeenCalledWith({
        userId,
        productId,
        variantId: null
      });

      // Verify the result
      expect(result).toBe(false);
    });

    it('should handle errors when removing from wishlist', async () => {
      // Mock the delete method to throw an error
      mockRepository.delete.mockRejectedValueOnce(new Error('Database error'));

      // Call the service method and expect it to throw
      await expect(wishlistService.removeFromWishlist(userId, productId)).rejects.toThrow('Failed to remove product from wishlist');
    });
  });

  describe('isInWishlist', () => {
    it('should return the wishlist item if product is in wishlist', async () => {
      // Mock the findOne method to return an item
      const wishlistItem = new Wishlist();
      wishlistItem.id = '123';
      wishlistItem.userId = userId;
      wishlistItem.productId = productId;
      
      mockRepository.findOne.mockResolvedValueOnce(wishlistItem);

      // Call the service method
      const result = await wishlistService.isInWishlist(userId, productId);

      // Verify the repository method was called correctly
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          productId,
          variantId: null
        }
      });

      // Verify the result
      expect(result).toEqual(wishlistItem);
    });

    it('should return null if product is not in wishlist', async () => {
      // Mock the findOne method to return null
      mockRepository.findOne.mockResolvedValueOnce(null);

      // Call the service method
      const result = await wishlistService.isInWishlist(userId, productId);

      // Verify the repository method was called correctly
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          productId,
          variantId: null
        }
      });

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('countWishlistItems', () => {
    it('should return the number of items in the wishlist', async () => {
      // Mock the count method
      mockRepository.count.mockResolvedValueOnce(5);

      // Call the service method
      const result = await wishlistService.countWishlistItems(userId);

      // Verify the repository method was called correctly
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { userId }
      });

      // Verify the result
      expect(result).toBe(5);
    });
  });
}); 