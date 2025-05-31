import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateService } from '@services/rate.service';
import { rateFetcher } from '@utils/rateFetcher';
import { Currency } from '@entities/Currency';
import { AppDataSource } from '@config/dataSource';
import { env } from '@config/env';

// Mock TypeORM repositories
vi.mock('@config/dataSource', () => {
  const mockRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    upsert: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
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
      JPY: 110,
      CAD: 1.25,
      AUD: 1.35
    }),
    getMetadata: vi.fn().mockResolvedValue({
      lastUpdated: '2023-08-20T12:00:00Z',
      source: 'test'
    })
  }
}));

// Mock env
vi.mock('@config/env', () => ({
  env: {
    DEFAULT_CURRENCY: 'USD',
    CURRENCY_UPDATE_INTERVAL: 3600
  }
}));

describe('Rate Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialize', () => {
    it('should fetch and store rates on initialization', async () => {
      // Mock repository responses
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.save = vi.fn().mockResolvedValue([]);

      // Initialize the service
      await rateService.initialize();

      // Verify that rates were fetched
      expect(rateFetcher.getRates).toHaveBeenCalled();
      
      // Verify that rates were saved to the database
      expect(mockRepo.save).toHaveBeenCalled();
      
      // Check that the save was called with the correct data structure
      const saveCall = mockRepo.save.mock.calls[0][0];
      expect(Array.isArray(saveCall)).toBe(true);
      
      // Verify the data structure of saved currencies
      if (Array.isArray(saveCall)) {
        expect(saveCall.length).toBeGreaterThan(0);
        expect(saveCall[0]).toHaveProperty('code');
        expect(saveCall[0]).toHaveProperty('rate');
        expect(saveCall[0]).toHaveProperty('lastUpdated');
      }
    });
  });

  describe('convert', () => {
    it('should convert between currencies correctly', async () => {
      // Mock repository responses for currency rates
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.find = vi.fn().mockResolvedValue([
        { code: 'USD', rate: 1, lastUpdated: new Date() },
        { code: 'EUR', rate: 0.85, lastUpdated: new Date() },
        { code: 'GBP', rate: 0.75, lastUpdated: new Date() },
        { code: 'JPY', rate: 110, lastUpdated: new Date() }
      ]);

      // Test various conversions
      // USD to EUR
      const usdToEur = await rateService.convert(100, 'USD', 'EUR');
      expect(usdToEur).toBe(85); // 100 USD * 0.85 = 85 EUR

      // EUR to USD
      const eurToUsd = await rateService.convert(100, 'EUR', 'USD');
      expect(eurToUsd).toBe(117.65); // 100 EUR / 0.85 = 117.65 USD

      // USD to GBP
      const usdToGbp = await rateService.convert(100, 'USD', 'GBP');
      expect(usdToGbp).toBe(75); // 100 USD * 0.75 = 75 GBP

      // EUR to GBP
      const eurToGbp = await rateService.convert(100, 'EUR', 'GBP');
      expect(eurToGbp).toBe(88.24); // 100 EUR / 0.85 * 0.75 = 88.24 GBP

      // JPY to USD
      const jpyToUsd = await rateService.convert(1000, 'JPY', 'USD');
      expect(jpyToUsd).toBe(9.09); // 1000 JPY / 110 = 9.09 USD
    });

    it('should handle same currency conversion', async () => {
      // Test conversion within the same currency
      const result = await rateService.convert(100, 'USD', 'USD');
      expect(result).toBe(100); // Same currency should return the original amount
    });

    it('should throw error for invalid currency', async () => {
      // Mock repository to return only USD and EUR
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.find = vi.fn().mockResolvedValue([
        { code: 'USD', rate: 1, lastUpdated: new Date() },
        { code: 'EUR', rate: 0.85, lastUpdated: new Date() }
      ]);

      // Test with invalid source currency
      await expect(rateService.convert(100, 'XYZ', 'USD')).rejects.toThrow();
      
      // Test with invalid target currency
      await expect(rateService.convert(100, 'USD', 'XYZ')).rejects.toThrow();
    });
  });

  describe('refreshRates', () => {
    it('should fetch and update rates', async () => {
      // Mock repository responses
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.upsert = vi.fn().mockResolvedValue({ raw: [], generatedMaps: [] });

      // Call refresh rates
      await rateService.refreshRates();

      // Verify that rates were fetched
      expect(rateFetcher.getRates).toHaveBeenCalled();
      
      // Verify that rates were upserted to the database
      expect(mockRepo.upsert).toHaveBeenCalled();
    });

    it('should handle errors during refresh', async () => {
      // Mock rateFetcher to throw an error
      vi.mocked(rateFetcher.getRates).mockRejectedValueOnce(new Error('API error'));

      // Call refresh rates
      await expect(rateService.refreshRates()).rejects.toThrow('Failed to refresh currency rates');
    });
  });

  describe('getAllRates', () => {
    it('should return all currency rates', async () => {
      // Mock repository response
      const mockRates = [
        { code: 'USD', rate: 1, lastUpdated: new Date() },
        { code: 'EUR', rate: 0.85, lastUpdated: new Date() },
        { code: 'GBP', rate: 0.75, lastUpdated: new Date() }
      ];
      
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.find = vi.fn().mockResolvedValue(mockRates);

      // Get all rates
      const rates = await rateService.getAllRates();

      // Verify result
      expect(rates).toEqual(mockRates);
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('getRate', () => {
    it('should return rate for a specific currency', async () => {
      // Mock repository response
      const mockRate = { code: 'EUR', rate: 0.85, lastUpdated: new Date() };
      
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.findOne = vi.fn().mockResolvedValue(mockRate);

      // Get specific rate
      const rate = await rateService.getRate('EUR');

      // Verify result
      expect(rate).toEqual(mockRate);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { code: 'EUR' } });
    });

    it('should throw error for non-existent currency', async () => {
      // Mock repository to return null
      const mockRepo = AppDataSource.getRepository(Currency);
      mockRepo.findOne = vi.fn().mockResolvedValue(null);

      // Try to get non-existent currency
      await expect(rateService.getRate('XYZ')).rejects.toThrow('Currency XYZ not found');
    });
  });
}); 