import { Repository, DataSource, Not } from 'typeorm';
import { Address, AddressType } from '../entities';
import logger from '../utils/logger';

export class AddressService {
  private addressRepo: Repository<Address>;

  constructor(public dataSource: DataSource) {
    this.addressRepo = dataSource.getRepository(Address);
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string) {
    const addresses = await this.addressRepo.find({
      where: { userId },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC'
      }
    });

    return addresses;
  }

  /**
   * Get a specific address by ID and verify ownership
   */
  async getAddressById(id: string, userId: string) {
    const address = await this.addressRepo.findOne({
      where: { id, userId }
    });

    if (!address) {
      throw new Error('Address not found or does not belong to user');
    }

    return address;
  }

  /**
   * Add a new address for a user
   */
  async createAddress(userId: string, data: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    apartment?: string;
    type?: AddressType;
    isDefault?: boolean;
    phone?: string;
    instructions?: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If this is the first address or marked as default, unset other defaults
      if (data.isDefault) {
        await queryRunner.manager.update(
          Address,
          { userId },
          { isDefault: false }
        );
      }

      // If this is the first address, make it default regardless
      const existingAddresses = await this.addressRepo.count({ where: { userId } });
      if (existingAddresses === 0) {
        data.isDefault = true;
      }

      const address = this.addressRepo.create({
        ...data,
        userId,
        type: data.type || AddressType.HOME
      });

      await queryRunner.manager.save(address);
      await queryRunner.commitTransaction();

      logger.info({ userId, addressId: address.id }, 'Address created successfully');
      return address;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error({ error, userId }, 'Failed to create address');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, userId: string, data: Partial<Address>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await this.getAddressById(id, userId);

      // If setting as default, unset other defaults
      if (data.isDefault && !address.isDefault) {
        await queryRunner.manager.update(
          Address,
          { userId, id: Not(id) },
          { isDefault: false }
        );
      }

      const updatedAddress = await queryRunner.manager.save(Address, {
        ...address,
        ...data
      });

      await queryRunner.commitTransaction();

      logger.info({ userId, addressId: id }, 'Address updated successfully');
      return updatedAddress;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error({ error, userId, addressId: id }, 'Failed to update address');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify address exists and belongs to user
      await this.getAddressById(id, userId);

      // Unset current default
      await queryRunner.manager.update(
        Address,
        { userId },
        { isDefault: false }
      );

      // Set new default
      await queryRunner.manager.update(
        Address,
        { id, userId },
        { isDefault: true }
      );

      await queryRunner.commitTransaction();

      logger.info({ userId, addressId: id }, 'Default address updated');
      return this.getAddressById(id, userId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error({ error, userId, addressId: id }, 'Failed to set default address');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await this.getAddressById(id, userId);

      await queryRunner.manager.remove(address);

      // If deleted address was default and other addresses exist, make the most recent one default
      if (address.isDefault) {
        const remainingAddress = await queryRunner.manager.findOne(Address, {
          where: { userId },
          order: { createdAt: 'DESC' }
        });

        if (remainingAddress) {
          remainingAddress.isDefault = true;
          await queryRunner.manager.save(remainingAddress);
        }
      }

      await queryRunner.commitTransaction();

      logger.info({ userId, addressId: id }, 'Address deleted successfully');
      return true;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error({ error, userId, addressId: id }, 'Failed to delete address');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get addresses by type
   */
  async getAddressesByType(userId: string, type: AddressType) {
    const addresses = await this.addressRepo.find({
      where: { userId, type },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC'
      }
    });

    return addresses;
  }
} 