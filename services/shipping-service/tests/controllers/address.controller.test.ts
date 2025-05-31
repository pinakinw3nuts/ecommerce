import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressController } from '@controllers/address.controller';
import { AddressService } from '@services/address.service';
import { AddressType } from '@entities/Address';

// Mock the AddressService
vi.mock('@services/address.service');

describe('AddressController', () => {
  let addressController: AddressController;
  
  // Mock Fastify request and reply
  const mockRequest: any = {
    user: { userId: 'test-user-id' },
    params: {},
    query: {},
    body: {}
  };
  
  const mockReply: any = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
  
  // Mock address data
  const mockAddress = {
    id: 'test-address-id',
    userId: 'test-user-id',
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'US',
    pincode: '10001',
    phone: '1234567890',
    type: AddressType.SHIPPING,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create controller instance
    addressController = new AddressController();
    
    // Mock AddressService methods
    const mockAddressService = AddressService.prototype;
    mockAddressService.listAddresses = vi.fn().mockResolvedValue([mockAddress]);
    mockAddressService.getAddressById = vi.fn().mockResolvedValue(mockAddress);
    mockAddressService.createAddress = vi.fn().mockResolvedValue(mockAddress);
    mockAddressService.updateAddress = vi.fn().mockResolvedValue(mockAddress);
    mockAddressService.deleteAddress = vi.fn().mockResolvedValue(undefined);
    mockAddressService.setDefaultAddress = vi.fn().mockResolvedValue(mockAddress);
  });
  
  describe('listAddresses', () => {
    it('should return addresses for authenticated user', async () => {
      await addressController.listAddresses(mockRequest, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith([mockAddress]);
      expect(AddressService.prototype.listAddresses).toHaveBeenCalledWith('test-user-id', undefined);
    });
    
    it('should filter addresses by type', async () => {
      const requestWithType = {
        ...mockRequest,
        query: { type: AddressType.SHIPPING }
      };
      
      await addressController.listAddresses(requestWithType, mockReply);
      
      expect(AddressService.prototype.listAddresses).toHaveBeenCalledWith('test-user-id', AddressType.SHIPPING);
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const requestWithoutUser = { ...mockRequest, user: undefined };
      
      await addressController.listAddresses(requestWithoutUser, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    });
    
    it('should handle errors', async () => {
      AddressService.prototype.listAddresses = vi.fn().mockRejectedValue(new Error('Service error'));
      
      await addressController.listAddresses(mockRequest, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
  
  describe('getAddressById', () => {
    it('should return address by ID', async () => {
      const requestWithId = {
        ...mockRequest,
        params: { id: 'test-address-id' }
      };
      
      await addressController.getAddressById(requestWithId, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockAddress);
      expect(AddressService.prototype.getAddressById).toHaveBeenCalledWith('test-address-id', 'test-user-id');
    });
    
    it('should return 404 if address not found', async () => {
      AddressService.prototype.getAddressById = vi.fn().mockResolvedValue(null);
      
      const requestWithId = {
        ...mockRequest,
        params: { id: 'non-existent-id' }
      };
      
      await addressController.getAddressById(requestWithId, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        statusCode: 404,
        error: 'Not Found',
        message: 'Address not found'
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const requestWithoutUser = {
        ...mockRequest,
        user: undefined,
        params: { id: 'test-address-id' }
      };
      
      await addressController.getAddressById(requestWithoutUser, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(401);
    });
    
    it('should handle errors', async () => {
      AddressService.prototype.getAddressById = vi.fn().mockRejectedValue(new Error('Service error'));
      
      const requestWithId = {
        ...mockRequest,
        params: { id: 'test-address-id' }
      };
      
      await addressController.getAddressById(requestWithId, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });
  
  describe('createAddress', () => {
    it('should create a new address', async () => {
      const newAddressData = {
        fullName: 'Jane Doe',
        addressLine1: '456 Oak St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        pincode: '90001',
        phone: '9876543210',
        type: AddressType.SHIPPING
      };
      
      const requestWithBody = {
        ...mockRequest,
        body: newAddressData
      };
      
      await addressController.createAddress(requestWithBody, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(mockAddress);
      expect(AddressService.prototype.createAddress).toHaveBeenCalledWith('test-user-id', newAddressData);
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const requestWithoutUser = { ...mockRequest, user: undefined };
      
      await addressController.createAddress(requestWithoutUser, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(401);
    });
    
    it('should handle errors', async () => {
      AddressService.prototype.createAddress = vi.fn().mockRejectedValue(new Error('Service error'));
      
      await addressController.createAddress(mockRequest, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });
  
  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      const updateData = {
        fullName: 'Updated Name',
        addressLine1: 'Updated Address'
      };
      
      const requestWithParamsAndBody = {
        ...mockRequest,
        params: { id: 'test-address-id' },
        body: updateData
      };
      
      await addressController.updateAddress(requestWithParamsAndBody, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockAddress);
      expect(AddressService.prototype.updateAddress).toHaveBeenCalledWith('test-address-id', 'test-user-id', updateData);
    });
    
    it('should return 404 if address not found', async () => {
      AddressService.prototype.updateAddress = vi.fn().mockRejectedValue(new Error('Address not found'));
      
      const requestWithParamsAndBody = {
        ...mockRequest,
        params: { id: 'non-existent-id' },
        body: { fullName: 'Updated Name' }
      };
      
      await addressController.updateAddress(requestWithParamsAndBody, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(404);
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const requestWithoutUser = {
        ...mockRequest,
        user: undefined,
        params: { id: 'test-address-id' }
      };
      
      await addressController.updateAddress(requestWithoutUser, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(401);
    });
    
    it('should handle errors', async () => {
      AddressService.prototype.updateAddress = vi.fn().mockRejectedValue(new Error('Service error'));
      
      const requestWithParamsAndBody = {
        ...mockRequest,
        params: { id: 'test-address-id' },
        body: { fullName: 'Updated Name' }
      };
      
      await addressController.updateAddress(requestWithParamsAndBody, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });
  
  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      const requestWithParams = {
        ...mockRequest,
        params: { id: 'test-address-id' }
      };
      
      await addressController.deleteAddress(requestWithParams, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(204);
      expect(mockReply.send).toHaveBeenCalled();
      expect(AddressService.prototype.deleteAddress).toHaveBeenCalledWith('test-address-id', 'test-user-id');
    });
    
    it('should return 404 if address not found', async () => {
      AddressService.prototype.deleteAddress = vi.fn().mockRejectedValue(new Error('Address not found'));
      
      const requestWithParams = {
        ...mockRequest,
        params: { id: 'non-existent-id' }
      };
      
      await addressController.deleteAddress(requestWithParams, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(404);
    });
    
    it('should return 401 if user is not authenticated', async () => {
      const requestWithoutUser = {
        ...mockRequest,
        user: undefined,
        params: { id: 'test-address-id' }
      };
      
      await addressController.deleteAddress(requestWithoutUser, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(401);
    });
    
    it('should handle errors', async () => {
      AddressService.prototype.deleteAddress = vi.fn().mockRejectedValue(new Error('Service error'));
      
      const requestWithParams = {
        ...mockRequest,
        params: { id: 'test-address-id' }
      };
      
      await addressController.deleteAddress(requestWithParams, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });
}); 