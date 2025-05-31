import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { pricingService } from '@services/pricing.service';
import { rateFetcher } from '@utils/rateFetcher';
import { PriceList } from '@entities/PriceList';
import { ProductPrice } from '@entities/ProductPrice';
import { CustomerGroup } from '@entities/CustomerGroup';
import { Currency } from '@entities/Currency';
import { AppDataSource } from '@config/dataSource';

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
    }
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

// Mock ProductPrice class with tiered pricing functionality
class MockProductPrice {
  id: string;
  productId: string;
  priceListId: string;
  basePrice: number;
  salePrice: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  active: boolean;
  tieredPrices: Array<{ quantity: number; price: number; name?: string }>;
  priceList?: any;

  constructor(data: Partial<MockProductPrice>) {
    Object.assign(this, data);
  }

  getEffectivePrice(quantity: number): number {
    // Check if on sale
    const now = new Date();
    const isOnSale = 
      this.salePrice !== null && 
      (!this.saleStartDate || this.saleStartDate <= now) &&
      (!this.saleEndDate || this.saleEndDate >= now);
    
    // Base price (either regular or sale price)
    const basePrice = isOnSale && this.salePrice !== null ? this.salePrice : this.basePrice;
    
    // If no tiered prices or quantity is 1, return base price
    if (!this.tieredPrices || !Array.isArray(this.tieredPrices) || quantity === 1) {
      return basePrice;
    }
    
    // Find applicable tier
    const applicableTiers = this.tieredPrices
      .filter(tier => tier.quantity <= quantity)
      .sort((a, b) => b.quantity - a.quantity);
    
    // Return tiered price if found, otherwise base price
    return applicableTiers.length > 0 ? applicableTiers[0].price : basePrice;
  }
}

describe('Pricing Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('calculatePrice', () => {
    it('should calculate correct price for a single product', async () => {
      // Mock product price
      const mockProductPrice = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'pricelist1',
        basePrice: 100,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { currency: 'USD' }
      });

      // Mock repository response
      const mockRepo = AppDataSource.getRepository(ProductPrice);
      mockRepo.findOne = vi.fn().mockResolvedValue(mockProductPrice);

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      mockPriceListRepo.findOne = vi.fn().mockResolvedValue({
        id: 'pricelist1',
        currency: 'USD',
        customerGroupId: null,
        active: true
      });

      // Call the service
      const result = await pricingService.calculatePrice('product1', 1);

      // Verify result
      expect(result).toEqual({
        price: 100,
        originalPrice: 100,
        currency: 'USD',
        onSale: false,
        priceListId: 'pricelist1'
      });
    });

    it('should apply tiered pricing based on quantity', async () => {
      // Mock product price with tiered pricing
      const mockProductPrice = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'pricelist1',
        basePrice: 100,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [
          { quantity: 5, price: 90, name: '5+ units' },
          { quantity: 10, price: 80, name: '10+ units' },
          { quantity: 20, price: 70, name: '20+ units' }
        ],
        priceList: { currency: 'USD' }
      });

      // Mock repository response
      const mockRepo = AppDataSource.getRepository(ProductPrice);
      mockRepo.findOne = vi.fn().mockResolvedValue(mockProductPrice);

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      mockPriceListRepo.findOne = vi.fn().mockResolvedValue({
        id: 'pricelist1',
        currency: 'USD',
        customerGroupId: null,
        active: true
      });

      // Test different quantities
      const quantities = [1, 5, 10, 15, 20, 25];
      const expectedPrices = [100, 90, 80, 80, 70, 70];

      for (let i = 0; i < quantities.length; i++) {
        const result = await pricingService.calculatePrice('product1', quantities[i]);
        expect(result.price).toBe(expectedPrices[i]);
        expect(result.originalPrice).toBe(100);
        
        if (quantities[i] > 1) {
          expect(result.appliedTier).toBeDefined();
        }
      }
    });

    it('should apply sale price when product is on sale', async () => {
      // Set sale dates to make product on sale
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      // Mock product price with sale price
      const mockProductPrice = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'pricelist1',
        basePrice: 100,
        salePrice: 75,
        saleStartDate: yesterday,
        saleEndDate: tomorrow,
        active: true,
        tieredPrices: [],
        priceList: { currency: 'USD' }
      });

      // Mock repository response
      const mockRepo = AppDataSource.getRepository(ProductPrice);
      mockRepo.findOne = vi.fn().mockResolvedValue(mockProductPrice);

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      mockPriceListRepo.findOne = vi.fn().mockResolvedValue({
        id: 'pricelist1',
        currency: 'USD',
        customerGroupId: null,
        active: true
      });

      // Call the service
      const result = await pricingService.calculatePrice('product1', 1);

      // Verify result
      expect(result).toEqual({
        price: 75,
        originalPrice: 100,
        currency: 'USD',
        onSale: true,
        priceListId: 'pricelist1',
        discountPercentage: 25
      });
    });

    it('should convert prices to requested currency', async () => {
      // Mock product price
      const mockProductPrice = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'pricelist1',
        basePrice: 100,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { currency: 'USD' }
      });

      // Mock repository response
      const mockRepo = AppDataSource.getRepository(ProductPrice);
      mockRepo.findOne = vi.fn().mockResolvedValue(mockProductPrice);

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      mockPriceListRepo.findOne = vi.fn().mockResolvedValue({
        id: 'pricelist1',
        currency: 'USD',
        customerGroupId: null,
        active: true
      });

      // Test conversion to EUR
      const resultEUR = await pricingService.calculatePrice('product1', 1, { currency: 'EUR' });
      expect(resultEUR.price).toBe(85); // 100 USD * 0.85 = 85 EUR
      expect(resultEUR.currency).toBe('EUR');

      // Test conversion to GBP
      const resultGBP = await pricingService.calculatePrice('product1', 1, { currency: 'GBP' });
      expect(resultGBP.price).toBe(75); // 100 USD * 0.75 = 75 GBP
      expect(resultGBP.currency).toBe('GBP');
    });

    it('should use customer group specific price lists', async () => {
      // Mock standard product price
      const standardProductPrice = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'standard-pricelist',
        basePrice: 100,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { 
          id: 'standard-pricelist',
          currency: 'USD',
          customerGroupId: null,
          priority: 0
        }
      });

      // Mock wholesale product price
      const wholesaleProductPrice = new MockProductPrice({
        id: 'price2',
        productId: 'product1',
        priceListId: 'wholesale-pricelist',
        basePrice: 80,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { 
          id: 'wholesale-pricelist',
          currency: 'USD',
          customerGroupId: 'wholesale-group',
          priority: 10
        }
      });

      // Mock VIP product price
      const vipProductPrice = new MockProductPrice({
        id: 'price3',
        productId: 'product1',
        priceListId: 'vip-pricelist',
        basePrice: 70,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { 
          id: 'vip-pricelist',
          currency: 'USD',
          customerGroupId: 'vip-group',
          priority: 20
        }
      });

      // Mock price list repository to return price lists
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      const createQueryBuilderMock = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn()
      };
      
      mockPriceListRepo.createQueryBuilder = vi.fn().mockReturnValue(createQueryBuilderMock);

      // Mock product price repository
      const mockProductPriceRepo = AppDataSource.getRepository(ProductPrice);
      
      // Test standard price (no customer group)
      createQueryBuilderMock.getMany.mockResolvedValueOnce([
        { id: 'standard-pricelist', currency: 'USD', customerGroupId: null, priority: 0, active: true }
      ]);
      mockProductPriceRepo.findOne = vi.fn().mockResolvedValueOnce(standardProductPrice);
      
      const standardResult = await pricingService.calculatePrice('product1', 1);
      expect(standardResult.price).toBe(100);
      
      // Test wholesale price
      createQueryBuilderMock.getMany.mockResolvedValueOnce([
        { id: 'wholesale-pricelist', currency: 'USD', customerGroupId: 'wholesale-group', priority: 10, active: true },
        { id: 'standard-pricelist', currency: 'USD', customerGroupId: null, priority: 0, active: true }
      ]);
      mockProductPriceRepo.findOne = vi.fn()
        .mockResolvedValueOnce(wholesaleProductPrice);
      
      const wholesaleResult = await pricingService.calculatePrice('product1', 1, {
        customerGroupIds: ['wholesale-group']
      });
      expect(wholesaleResult.price).toBe(80);
      expect(wholesaleResult.customerGroupId).toBe('wholesale-group');
      
      // Test VIP price (highest priority)
      createQueryBuilderMock.getMany.mockResolvedValueOnce([
        { id: 'vip-pricelist', currency: 'USD', customerGroupId: 'vip-group', priority: 20, active: true },
        { id: 'wholesale-pricelist', currency: 'USD', customerGroupId: 'wholesale-group', priority: 10, active: true },
        { id: 'standard-pricelist', currency: 'USD', customerGroupId: null, priority: 0, active: true }
      ]);
      mockProductPriceRepo.findOne = vi.fn()
        .mockResolvedValueOnce(vipProductPrice);
      
      const vipResult = await pricingService.calculatePrice('product1', 1, {
        customerGroupIds: ['vip-group', 'wholesale-group']
      });
      expect(vipResult.price).toBe(70);
      expect(vipResult.customerGroupId).toBe('vip-group');
    });

    it('should combine tiered pricing, customer groups, and currency conversion', async () => {
      // Mock VIP product price with tiered pricing
      const vipProductPrice = new MockProductPrice({
        id: 'price3',
        productId: 'product1',
        priceListId: 'vip-pricelist',
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
          id: 'vip-pricelist',
          currency: 'USD',
          customerGroupId: 'vip-group',
          priority: 20
        }
      });

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      const createQueryBuilderMock = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn()
      };
      
      mockPriceListRepo.createQueryBuilder = vi.fn().mockReturnValue(createQueryBuilderMock);
      createQueryBuilderMock.getMany.mockResolvedValue([
        { id: 'vip-pricelist', currency: 'USD', customerGroupId: 'vip-group', priority: 20, active: true }
      ]);

      // Mock product price repository
      const mockProductPriceRepo = AppDataSource.getRepository(ProductPrice);
      mockProductPriceRepo.findOne = vi.fn().mockResolvedValue(vipProductPrice);
      
      // Test with quantity 10 and EUR currency
      const result = await pricingService.calculatePrice('product1', 10, {
        customerGroupIds: ['vip-group'],
        currency: 'EUR'
      });
      
      // Verify result: 80 USD (tiered price) converted to EUR (80 * 0.85 = 68)
      expect(result.price).toBe(68);
      expect(result.currency).toBe('EUR');
      expect(result.customerGroupId).toBe('vip-group');
      expect(result.appliedTier).toEqual({ quantity: 10, price: 80 });
    });
  });

  describe('calculatePrices', () => {
    it('should calculate prices for multiple products', async () => {
      // Mock product prices
      const mockProductPrice1 = new MockProductPrice({
        id: 'price1',
        productId: 'product1',
        priceListId: 'pricelist1',
        basePrice: 100,
        salePrice: null,
        saleStartDate: null,
        saleEndDate: null,
        active: true,
        tieredPrices: [],
        priceList: { currency: 'USD' }
      });

      const mockProductPrice2 = new MockProductPrice({
        id: 'price2',
        productId: 'product2',
        priceListId: 'pricelist1',
        basePrice: 200,
        salePrice: 150,
        saleStartDate: new Date(Date.now() - 86400000), // Yesterday
        saleEndDate: new Date(Date.now() + 86400000), // Tomorrow
        active: true,
        tieredPrices: [],
        priceList: { currency: 'USD' }
      });

      // Mock price list repository
      const mockPriceListRepo = AppDataSource.getRepository(PriceList);
      const createQueryBuilderMock = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn()
      };
      
      mockPriceListRepo.createQueryBuilder = vi.fn().mockReturnValue(createQueryBuilderMock);
      createQueryBuilderMock.getMany.mockResolvedValue([
        { id: 'pricelist1', currency: 'USD', customerGroupId: null, priority: 0, active: true }
      ]);

      // Mock product price repository
      const mockProductPriceRepo = AppDataSource.getRepository(ProductPrice);
      mockProductPriceRepo.find = vi.fn().mockResolvedValue([mockProductPrice1, mockProductPrice2]);
      
      // Calculate prices for both products
      const results = await pricingService.calculatePrices(['product1', 'product2'], 1);
      
      // Verify results
      expect(results).toHaveProperty('product1');
      expect(results).toHaveProperty('product2');
      expect(results.product1.price).toBe(100);
      expect(results.product2.price).toBe(150);
      expect(results.product2.onSale).toBe(true);
    });
  });
}); 