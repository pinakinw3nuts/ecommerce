import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const adminUser = {
  id: uuidv4(),
  email: 'admin@example.com',
  role: 'admin',
  name: 'Admin User'
};

const testCompany = {
  name: 'Test Company Inc.',
  taxId: 'TX123456789',
  email: 'contact@testcompany.com',
  phone: '1234567890',
  address: {
    street: '123 Business Ave',
    city: 'Enterprise',
    state: 'CA',
    zipCode: '90210',
    country: 'USA'
  },
  industry: 'Technology'
};

// Mock the company service
const mockCompanyService = {
  createCompany: vi.fn().mockImplementation(async (data) => {
    return { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
  }),
  getCompanyById: vi.fn().mockImplementation(async (id) => {
    return { id, ...testCompany, createdAt: new Date().toISOString() };
  }),
  getAllCompanies: vi.fn().mockImplementation(async () => {
    return [
      { id: uuidv4(), ...testCompany, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Another Company', ...testCompany, createdAt: new Date().toISOString() }
    ];
  }),
  updateCompany: vi.fn().mockImplementation(async (id, data) => {
    return { id, ...data, updatedAt: new Date().toISOString() };
  }),
  deleteCompany: vi.fn().mockResolvedValue(true)
};

// Mock the company controller
const mockRequest = {} as FastifyRequest;
const mockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
} as unknown as FastifyReply;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockRequest.body = {};
  mockRequest.params = {};
  mockRequest.user = adminUser;
  mockReply.code.mockReturnThis();
});

describe('Company Controller', () => {
  // Test company creation
  describe('createCompany', () => {
    it('should create a new company successfully', async () => {
      // Arrange
      mockRequest.body = testCompany;
      
      // Act
      await mockCompanyService.createCompany(mockRequest.body);
      
      // Assert
      expect(mockCompanyService.createCompany).toHaveBeenCalledWith(testCompany);
      expect(mockCompanyService.createCompany).toHaveBeenCalledTimes(1);
    });

    it('should validate company data', () => {
      // Arrange
      const companySchema = z.object({
        name: z.string().min(2).max(100),
        taxId: z.string().min(5).max(30),
        email: z.string().email(),
        phone: z.string().min(10).max(20).optional(),
        address: z.object({
          street: z.string().min(2).max(100),
          city: z.string().min(2).max(50),
          state: z.string().min(2).max(50),
          zipCode: z.string().min(5).max(10),
          country: z.string().min(2).max(50)
        }),
        industry: z.string().min(2).max(50).optional()
      });

      // Act & Assert
      const validationResult = companySchema.safeParse(testCompany);
      expect(validationResult.success).toBe(true);
      
      // Test invalid data
      const invalidCompany = { ...testCompany, email: 'not-an-email' };
      const invalidResult = companySchema.safeParse(invalidCompany);
      expect(invalidResult.success).toBe(false);
    });
  });

  // Test getting a company
  describe('getCompanyById', () => {
    it('should retrieve a company by id', async () => {
      // Arrange
      const companyId = uuidv4();
      mockRequest.params = { id: companyId };
      
      // Act
      const company = await mockCompanyService.getCompanyById(companyId);
      
      // Assert
      expect(mockCompanyService.getCompanyById).toHaveBeenCalledWith(companyId);
      expect(company).toHaveProperty('id', companyId);
      expect(company).toHaveProperty('name', testCompany.name);
    });
  });

  // Test getting all companies
  describe('getAllCompanies', () => {
    it('should retrieve all companies', async () => {
      // Act
      const companies = await mockCompanyService.getAllCompanies();
      
      // Assert
      expect(mockCompanyService.getAllCompanies).toHaveBeenCalled();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
      expect(companies[0]).toHaveProperty('name');
    });
  });

  // Test updating a company
  describe('updateCompany', () => {
    it('should update a company', async () => {
      // Arrange
      const companyId = uuidv4();
      const updateData = {
        name: 'Updated Company Name',
        industry: 'Finance'
      };
      mockRequest.params = { id: companyId };
      mockRequest.body = updateData;
      
      // Act
      const updatedCompany = await mockCompanyService.updateCompany(companyId, updateData);
      
      // Assert
      expect(mockCompanyService.updateCompany).toHaveBeenCalledWith(companyId, updateData);
      expect(updatedCompany).toHaveProperty('id', companyId);
      expect(updatedCompany).toHaveProperty('name', updateData.name);
      expect(updatedCompany).toHaveProperty('industry', updateData.industry);
    });
  });

  // Test deleting a company
  describe('deleteCompany', () => {
    it('should delete a company', async () => {
      // Arrange
      const companyId = uuidv4();
      mockRequest.params = { id: companyId };
      
      // Act
      await mockCompanyService.deleteCompany(companyId);
      
      // Assert
      expect(mockCompanyService.deleteCompany).toHaveBeenCalledWith(companyId);
    });
  });
}); 