import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressService } from '@services/address.service';
import { Address, AddressType } from '@entities/Address';
import { AppDataSource } from '@config/dataSource';

describe('AddressService', () => {
  let addressService: AddressService;
  const userId = 'test-user-id';
  const mockAddress: Partial<Address> = {
    id: 'test-address-id',
    userId,
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

  // Mock repositories
  const mockAddressRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock repository
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockAddressRepository as any);
    
    // Create service instance
    addressService = new AddressService();
    
    // Default mock implementations
    mockAddressRepository.find.mockResolvedValue([mockAddress]);
    mockAddressRepository.findOne.mockResolvedValue(mockAddress);
    mockAddressRepository.create.mockReturnValue(mockAddress);
    mockAddressRepository.save.mockResolvedValue(mockAddress);
    mockAddressRepository.update.mockResolvedValue({ affected: 1 });
    mockAddressRepository.delete.mockResolvedValue({ affected: 1 });
  });

  describe('listAddresses', () => {
    it('should list all addresses for a user', async () => {
      const addresses = await addressService.listAddresses(userId);
      
      expect(addresses).toEqual([mockAddress]);
      expect(mockAddressRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: {
          isDefault: 'DESC',
          createdAt: 'DESC'
        }
      });
    });

    it('should filter addresses by type', async () => {
      await addressService.listAddresses(userId, AddressType.SHIPPING);
      
      expect(mockAddressRepository.find).toHaveBeenCalledWith({
        where: { userId, type: AddressType.SHIPPING },
        order: {
          isDefault: 'DESC',
          createdAt: 'DESC'
        }
      });
    });

    it('should handle errors', async () => {
      mockAddressRepository.find.mockRejectedValue(new Error('Database error'));
      
      await expect(addressService.listAddresses(userId)).rejects.toThrow('Failed to list addresses');
    });
  });

  describe('getAddressById', () => {
    it('should get an address by ID', async () => {
      const address = await addressService.getAddressById('test-address-id', userId);
      
      expect(address).toEqual(mockAddress);
      expect(mockAddressRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-address-id', userId }
      });
    });

    it('should return null if address not found', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);
      
      const address = await addressService.getAddressById('non-existent-id', userId);
      
      expect(address).toBeNull();
    });

    it('should handle errors', async () => {
      mockAddressRepository.findOne.mockRejectedValue(new Error('Database error'));
      
      await expect(addressService.getAddressById('test-address-id', userId)).rejects.toThrow('Failed to get address');
    });
  });

  describe('createAddress', () => {
    it('should create a new address', async () => {
      const newAddressData: Partial<Address> = {
        fullName: 'Jane Doe',
        addressLine1: '456 Oak St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        pincode: '90001',
        phone: '9876543210',
        type: AddressType.SHIPPING
      };
      
      mockAddressRepository.find.mockResolvedValue([]);
      
      const createdAddress = await addressService.createAddress(userId, newAddressData);
      
      expect(createdAddress).toEqual(mockAddress);
      expect(mockAddressRepository.create).toHaveBeenCalledWith({
        ...newAddressData,
        userId,
        isDefault: true // Should be default since it's the first address
      });
      expect(mockAddressRepository.save).toHaveBeenCalled();
    });

    it('should handle setting default status for new addresses', async () => {
      const existingAddresses = [{ ...mockAddress, isDefault: true }];
      mockAddressRepository.find.mockResolvedValue(existingAddresses);
      
      const newAddressData: Partial<Address> = {
        fullName: 'Jane Doe',
        addressLine1: '456 Oak St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        pincode: '90001',
        phone: '9876543210',
        type: AddressType.SHIPPING,
        isDefault: true
      };
      
      await addressService.createAddress(userId, newAddressData);
      
      // Should unset existing default
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        { userId, type: AddressType.SHIPPING, isDefault: true },
        { isDefault: false }
      );
    });

    it('should handle errors', async () => {
      mockAddressRepository.save.mockRejectedValue(new Error('Database error'));
      
      await expect(addressService.createAddress(userId, mockAddress)).rejects.toThrow('Failed to create address');
    });
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      const updateData: Partial<Address> = {
        fullName: 'Updated Name',
        addressLine1: 'Updated Address'
      };
      
      const updatedAddress = await addressService.updateAddress('test-address-id', userId, updateData);
      
      expect(updatedAddress).toEqual(mockAddress);
      expect(mockAddressRepository.update).toHaveBeenCalledWith('test-address-id', updateData);
    });

    it('should throw error if address not found', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);
      
      await expect(addressService.updateAddress('non-existent-id', userId, {})).rejects.toThrow('Address not found');
    });

    it('should handle setting as default', async () => {
      const updateData: Partial<Address> = {
        isDefault: true
      };
      
      await addressService.updateAddress('test-address-id', userId, updateData);
      
      // Should unset existing default
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        { userId, type: mockAddress.type, isDefault: true },
        { isDefault: false }
      );
      
      // Should update the address
      expect(mockAddressRepository.update).toHaveBeenCalledWith('test-address-id', updateData);
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      await addressService.deleteAddress('test-address-id', userId);
      
      expect(mockAddressRepository.delete).toHaveBeenCalledWith('test-address-id');
    });

    it('should throw error if address not found', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);
      
      await expect(addressService.deleteAddress('non-existent-id', userId)).rejects.toThrow('Address not found');
    });

    it('should set a new default if deleting a default address', async () => {
      const defaultAddress = { ...mockAddress, isDefault: true };
      mockAddressRepository.findOne.mockResolvedValue(defaultAddress);
      
      const otherAddress = { ...mockAddress, id: 'other-address-id', isDefault: false };
      mockAddressRepository.find.mockResolvedValue([otherAddress]);
      
      await addressService.deleteAddress('test-address-id', userId);
      
      // Should delete the address
      expect(mockAddressRepository.delete).toHaveBeenCalledWith('test-address-id');
      
      // Should set another address as default
      expect(mockAddressRepository.update).toHaveBeenCalledWith('other-address-id', { isDefault: true });
    });
  });

  describe('setDefaultAddress', () => {
    it('should set an address as default', async () => {
      await addressService.setDefaultAddress('test-address-id', userId);
      
      // Should unset existing default
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        { userId, type: mockAddress.type, isDefault: true },
        { isDefault: false }
      );
      
      // Should set this address as default
      expect(mockAddressRepository.update).toHaveBeenCalledWith('test-address-id', { isDefault: true });
    });

    it('should throw error if address not found', async () => {
      mockAddressRepository.findOne.mockResolvedValue(null);
      
      await expect(addressService.setDefaultAddress('non-existent-id', userId)).rejects.toThrow('Address not found');
    });
  });
}); 