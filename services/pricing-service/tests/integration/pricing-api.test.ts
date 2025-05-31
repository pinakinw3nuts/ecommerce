import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { app } from '@/app';
import { AppDataSource } from '@config/dataSource';
import { ProductPrice } from '@entities/ProductPrice';
import { PriceList } from '@entities/PriceList';
import { Currency } from '@entities/Currency';

// Mock TypeORM repositories
vi.mock('@config/dataSource', () => {
  const mockRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn(),
      getOne: vi.fn()
    }))
  };

  return {
    AppDataSource: {
      getRepository: vi.fn().mockReturnValue(mockRepository),
      isInitialized: true
    },
    initializeDatabase: vi.fn().mockResolvedValue({})
  };
});

// Mock rateFetcher
vi.mock('@utils/rateFetcher', () => ({
  rateFetcher: {
    getRates: vi.fn().mockResolvedValue({
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      JPY: 110
    }),
    getMetadata: vi.fn().mockResolvedValue({
      lastUpdated: '2023-08-20T12:00:00Z',
      source: 'test'
    })
  }
}));

describe('Pricing API Integration Tests', () => {
  let server: FastifyInstance;
  
  // Setup server before tests
  beforeAll(async () => {
    server = Fastify();
    await server.register(app);
    
    // Mock currency data
    const mockCurrencyRepo = AppDataSource.getRepository(Currency);
    mockCurrencyRepo.find = vi.fn().mockResolvedValue([
      { code: 'USD', rate: 1, lastUpdated: new Date() },
      { code: 'EUR', rate: 0.85, lastUpdated: new Date() },
      { code: 'GBP', rate: 0.75, lastUpdated: new Date() }
    ]);
    
    // Setup mock price lists
    const mockPriceListRepo = AppDataSource.getRepository(PriceList);
    const createQueryBuilderMock = mockPriceListRepo.createQueryBuilder as any;
    
    createQueryBuilderMock().getMany.mockResolvedValue([
      { 
        id: 'standard-pricelist', 
        name: 'Standard', 
        currency: 'USD', 
        customerGroupId: null, 
        priority: 0, 
        active: true 
      },
      { 
        id: 'wholesale-pricelist', 
        name: 'Wholesale', 
        currency: 'USD', 
        customerGroupId: 'wholesale-group', 
        priority: 10, 
        active: true 
      }
    ]);
    
    // Setup mock product prices
    const mockProductPriceRepo = AppDataSource.getRepository(ProductPrice);
    mockProductPriceRepo.find = vi.fn().mockImplementation((options) => {
      // Check if we're searching for specific product IDs
      if (options?.where?.productId?.in) {
        const productIds = options.where.productId.in;
        
        // Return mock data for requested products
        return Promise.resolve(productIds.map(id => ({
          id: `price-${id}`,
          productId: id,
          priceListId: 'standard-pricelist',
          basePrice: id === 'product1' ? 100 : 200,
          salePrice: id === 'product2' ? 150 : null,
          saleStartDate: id === 'product2' ? new Date(Date.now() - 86400000) : null,
          saleEndDate: id === 'product2' ? new Date(Date.now() + 86400000) : null,
          active: true,
          tieredPrices: id === 'product1' ? [
            { quantity: 5, price: 90 },
            { quantity: 10, price: 80 }
          ] : [],
          priceList: { 
            id: 'standard-pricelist', 
            currency: 'USD',
            customerGroupId: null
          },
          getEffectivePrice: function(quantity: number) {
            // Implement tiered pricing logic
            if (this.tieredPrices && Array.isArray(this.tieredPrices) && quantity > 1) {
              const applicableTiers = this.tieredPrices
                .filter(tier => tier.quantity <= quantity)
                .sort((a, b) => b.quantity - a.quantity);
              
              if (applicableTiers.length > 0) {
                return applicableTiers[0].price;
              }
            }
            
            // Check if on sale
            const now = new Date();
            const isOnSale = 
              this.salePrice !== null && 
              (!this.saleStartDate || this.saleStartDate <= now) &&
              (!this.saleEndDate || this.saleEndDate >= now);
            
            return isOnSale ? this.salePrice : this.basePrice;
          }
        })));
      }
      
      return Promise.resolve([]);
    });
    
    // Setup mock for findOne
    mockProductPriceRepo.findOne = vi.fn().mockImplementation((options) => {
      if (options?.where?.productId === 'product1') {
        return Promise.resolve({
          id: 'price-product1',
          productId: 'product1',
          priceListId: 'standard-pricelist',
          basePrice: 100,
          salePrice: null,
          saleStartDate: null,
          saleEndDate: null,
          active: true,
          tieredPrices: [
            { quantity: 5, price: 90 },
            { quantity: 10, price: 80 }
          ],
          priceList: { 
            id: 'standard-pricelist', 
            currency: 'USD',
            customerGroupId: null
          },
          getEffectivePrice: function(quantity: number) {
            if (quantity >= 10) return 80;
            if (quantity >= 5) return 90;
            return 100;
          }
        });
      } else if (options?.where?.productId === 'product2') {
        return Promise.resolve({
          id: 'price-product2',
          productId: 'product2',
          priceListId: 'standard-pricelist',
          basePrice: 200,
          salePrice: 150,
          saleStartDate: new Date(Date.now() - 86400000),
          saleEndDate: new Date(Date.now() + 86400000),
          active: true,
          tieredPrices: [],
          priceList: { 
            id: 'standard-pricelist', 
            currency: 'USD',
            customerGroupId: null
          },
          getEffectivePrice: function() {
            return 150; // Always on sale
          }
        });
      }
      
      return Promise.resolve(null);
    });
  });
  
  // Cleanup after tests
  afterAll(async () => {
    await server.close();
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('GET /api/pricing/products/:productId', () => {
    it('should return correct price for a single product', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products/product1'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toEqual({
        price: 100,
        originalPrice: 100,
        currency: 'USD',
        onSale: false,
        priceListId: 'standard-pricelist'
      });
    });
    
    it('should apply tiered pricing based on quantity', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products/product1?quantity=10'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.price).toBe(80);
      expect(result.originalPrice).toBe(100);
      expect(result.appliedTier).toBeDefined();
    });
    
    it('should return sale price when product is on sale', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products/product2'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.price).toBe(150);
      expect(result.originalPrice).toBe(200);
      expect(result.onSale).toBe(true);
    });
    
    it('should convert prices to requested currency', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products/product1?currency=EUR'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.price).toBe(85); // 100 USD * 0.85 = 85 EUR
      expect(result.currency).toBe('EUR');
    });
    
    it('should return 404 for non-existent product', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products/non-existent-product'
      });
      
      expect(response.statusCode).toBe(404);
    });
  });
  
  describe('GET /api/pricing/products', () => {
    it('should return prices for multiple products', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products?ids=product1,product2'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('product1');
      expect(result).toHaveProperty('product2');
      expect(result.product1.price).toBe(100);
      expect(result.product2.price).toBe(150);
      expect(result.product2.onSale).toBe(true);
    });
    
    it('should apply quantity and currency conversion to all products', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products?ids=product1,product2&quantity=10&currency=EUR'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.product1.price).toBe(68); // 80 USD * 0.85 = 68 EUR (with tier discount)
      expect(result.product2.price).toBe(127.5); // 150 USD * 0.85 = 127.5 EUR
      expect(result.product1.currency).toBe('EUR');
      expect(result.product2.currency).toBe('EUR');
    });
    
    it('should return 400 for missing product ids', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/pricing/products'
      });
      
      expect(response.statusCode).toBe(400);
    });
  });
  
  describe('GET /api/rates', () => {
    it('should return all currency rates', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/rates'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('rate');
    });
  });
  
  describe('GET /api/rates/:code', () => {
    it('should return rate for a specific currency', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/rates/EUR'
      });
      
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('code', 'EUR');
      expect(result).toHaveProperty('rate', 0.85);
    });
    
    it('should return 404 for non-existent currency', async () => {
      // Mock findOne to return null for XYZ currency
      const mockCurrencyRepo = AppDataSource.getRepository(Currency);
      mockCurrencyRepo.findOne = vi.fn().mockImplementation((options) => {
        if (options?.where?.code === 'XYZ') {
          return Promise.resolve(null);
        }
        return Promise.resolve({ code: options?.where?.code, rate: 0.85, lastUpdated: new Date() });
      });
      
      const response = await server.inject({
        method: 'GET',
        url: '/api/rates/XYZ'
      });
      
      expect(response.statusCode).toBe(404);
    });
  });
}); 