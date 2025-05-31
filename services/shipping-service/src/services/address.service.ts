import { Repository } from 'typeorm';
import { Address, AddressType } from '../entities/Address';
import { AppDataSource } from '../config/dataSource';
import { logger } from '../utils/logger';

export class AddressService {
  private addressRepository: Repository<Address>;

  constructor() {
    this.addressRepository = AppDataSource.getRepository(Address);
  }

  /**
   * List all addresses for a user
   */
  async listAddresses(userId: string, type?: AddressType): Promise<Address[]> {
    try {
      const query = { userId };
      
      if (type) {
        Object.assign(query, { type });
      }
      
      return await this.addressRepository.find({
        where: query,
        order: {
          isDefault: 'DESC',
          createdAt: 'DESC'
        }
      });
    } catch (error) {
      logger.error('Error listing addresses', error);
      throw new Error('Failed to list addresses');
    }
  }

  /**
   * Get an address by ID
   */
  async getAddressById(id: string, userId: string): Promise<Address | null> {
    try {
      return await this.addressRepository.findOne({
        where: { id, userId }
      });
    } catch (error) {
      logger.error(`Error getting address with ID ${id}`, error);
      throw new Error('Failed to get address');
    }
  }

  /**
   * Create a new address
   */
  async createAddress(userId: string, addressData: Partial<Address>): Promise<Address> {
    try {
      // If this is the first address or marked as default, handle default status
      const existingAddresses = await this.listAddresses(userId, addressData.type as AddressType);
      
      // If this is the first address of this type, make it default
      if (existingAddresses.length === 0 || addressData.isDefault) {
        // If making this address default, unset any existing default of the same type
        if (existingAddresses.length > 0 && addressData.isDefault) {
          await this.addressRepository.update(
            { userId, type: addressData.type, isDefault: true },
            { isDefault: false }
          );
        }
        
        addressData.isDefault = true;
      }
      
      const address = this.addressRepository.create({
        ...addressData,
        userId
      });
      
      return await this.addressRepository.save(address);
    } catch (error) {
      logger.error('Error creating address', error);
      throw new Error('Failed to create address');
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, userId: string, addressData: Partial<Address>): Promise<Address> {
    try {
      // Check if address exists and belongs to the user
      const address = await this.getAddressById(id, userId);
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      // Handle default status if changing
      if (addressData.isDefault) {
        await this.addressRepository.update(
          { userId, type: address.type, isDefault: true },
          { isDefault: false }
        );
      }
      
      // Update the address
      await this.addressRepository.update(id, addressData);
      
      // Return the updated address
      return await this.getAddressById(id, userId) as Address;
    } catch (error) {
      logger.error(`Error updating address with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string, userId: string): Promise<void> {
    try {
      // Check if address exists and belongs to the user
      const address = await this.getAddressById(id, userId);
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      // Delete the address
      await this.addressRepository.delete(id);
      
      // If this was a default address, set another address of the same type as default
      if (address.isDefault) {
        const addresses = await this.listAddresses(userId, address.type);
        
        if (addresses.length > 0) {
          await this.addressRepository.update(addresses[0].id, { isDefault: true });
        }
      }
    } catch (error) {
      logger.error(`Error deleting address with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: string, userId: string): Promise<Address> {
    try {
      // Check if address exists and belongs to the user
      const address = await this.getAddressById(id, userId);
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      // Unset any existing default of the same type
      await this.addressRepository.update(
        { userId, type: address.type, isDefault: true },
        { isDefault: false }
      );
      
      // Set this address as default
      await this.addressRepository.update(id, { isDefault: true });
      
      // Return the updated address
      return await this.getAddressById(id, userId) as Address;
    } catch (error) {
      logger.error(`Error setting address ${id} as default`, error);
      throw error;
    }
  }
} 