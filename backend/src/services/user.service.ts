import { Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus, UserPreferences } from '../entities/User';
import { Address, AddressType } from '../entities/Address';
import { LoyaltyProgram, LoyaltyTier } from '../entities/LoyaltyProgram';
import { logger } from '../utils/logger';

export interface CreateUserOptions {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  country?: string;
}

export interface UpdateUserOptions {
  name?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdatePasswordOptions {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAddressOptions {
  type: AddressType;
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressOptions {
  type?: AddressType;
  firstName?: string;
  lastName?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface UserListOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: keyof User;
  sortOrder?: 'ASC' | 'DESC';
}

export class UserService {
  private userRepo: Repository<User>;
  private addressRepo: Repository<Address>;
  private loyaltyRepo: Repository<LoyaltyProgram>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.addressRepo = AppDataSource.getRepository(Address);
    this.loyaltyRepo = AppDataSource.getRepository(LoyaltyProgram);
  }

  /**
   * Create a new user
   */
  async createUser(options: CreateUserOptions): Promise<User> {
    logger.info('Creating new user:', { email: options.email, role: options.role });

    try {
      // Check if user already exists
      const existingUser = await this.userRepo.findOne({
        where: { email: options.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hash(options.password, 12);

      // Create user
      const user = this.userRepo.create({
        name: options.name,
        email: options.email.toLowerCase(),
        password: hashedPassword,
        role: options.role || UserRole.USER,
        phoneNumber: options.phoneNumber || null,
        country: options.country || null,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        preferences: null, // Will use defaults from toJSON()
      });

      const savedUser = await this.userRepo.save(user);

      // Create loyalty program for new user
      const loyaltyProgram = LoyaltyProgram.create(savedUser.id);
      await this.loyaltyRepo.save(loyaltyProgram);

      logger.info('User created successfully:', { userId: savedUser.id, email: savedUser.email });
      
      return savedUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, includeRelations = false): Promise<User | null> {
    logger.info('Getting user by ID:', { userId, includeRelations });

    try {
      const relations = includeRelations ? ['addresses', 'loyaltyProgram'] : [];
      
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations,
      });

      if (!user) {
        logger.warn('User not found:', { userId });
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string, includePassword = false): Promise<User | null> {
    logger.info('Getting user by email:', { email });

    try {
      const select = includePassword ? undefined : { password: false };
      
      const user = await this.userRepo.findOne({
        where: { email: email.toLowerCase() },
        select,
      });

      return user;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, options: UpdateUserOptions): Promise<User> {
    logger.info('Updating user:', { userId, options: { ...options, password: undefined } });

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if email is being changed and is available
      if (options.email && options.email !== user.email) {
        const existingUser = await this.getUserByEmail(options.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email is already in use');
        }
      }

      // Update user fields
      if (options.name !== undefined) user.name = options.name;
      if (options.email !== undefined) user.email = options.email.toLowerCase();
      if (options.phoneNumber !== undefined) user.phoneNumber = options.phoneNumber;
      if (options.country !== undefined) user.country = options.country;
      if (options.avatar !== undefined) user.avatar = options.avatar;
      
      // Update preferences (merge with existing)
      if (options.preferences) {
        const currentPreferences = user.preferences || user.getDefaultPreferences();
        user.preferences = { ...currentPreferences, ...options.preferences };
      }

      const updatedUser = await this.userRepo.save(user);
      logger.info('User updated successfully:', { userId });
      
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, options: UpdatePasswordOptions): Promise<boolean> {
    logger.info('Updating user password:', { userId });

    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'password'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await compare(options.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hash(options.newPassword, 12);
      
      // Update password
      await this.userRepo.update(userId, {
        password: hashedNewPassword,
        resetToken: undefined,
        resetTokenExpires: undefined,
      });

      logger.info('User password updated successfully:', { userId });
      return true;
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    logger.info('Updating user status:', { userId, status });

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.status = status;
      const updatedUser = await this.userRepo.save(user);
      
      logger.info('User status updated successfully:', { userId, status });
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * List users with pagination and filtering
   */
  async listUsers(options: UserListOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    logger.info('Listing users:', { page, limit, search, role, status });

    try {
      const queryBuilder = this.userRepo.createQueryBuilder('user');

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (status) {
        queryBuilder.andWhere('user.status = :status', { status });
      }

      // Apply sorting
      queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [users, total] = await queryBuilder.getManyAndCount();

      logger.info('Users listed successfully:', { count: users.length, total });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by changing status)
   */
  async deleteUser(userId: string): Promise<boolean> {
    logger.info('Deleting user:', { userId });

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete by changing status
      user.status = UserStatus.INACTIVE;
      await this.userRepo.save(user);

      logger.info('User deleted successfully:', { userId });
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== ADDRESS MANAGEMENT ====================

  /**
   * Create address for user
   */
  async createAddress(userId: string, options: CreateAddressOptions): Promise<Address> {
    logger.info('Creating address for user:', { userId, type: options.type });

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If this is set as default, unset other default addresses
      if (options.isDefault) {
        await this.addressRepo.update(
          { userId, isDefault: true },
          { isDefault: false }
        );
      }

      const address = this.addressRepo.create({
        userId,
        type: options.type,
        firstName: options.firstName,
        lastName: options.lastName,
        street: options.street,
        apartment: options.apartment || null,
        city: options.city,
        state: options.state,
        country: options.country,
        postalCode: options.postalCode,
        phone: options.phone || null,
        instructions: options.instructions || null,
        isDefault: options.isDefault || false,
      });

      const savedAddress = await this.addressRepo.save(address);
      logger.info('Address created successfully:', { addressId: savedAddress.id, userId });
      
      return savedAddress;
    } catch (error) {
      logger.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    logger.info('Getting user addresses:', { userId });

    try {
      const addresses = await this.addressRepo.find({
        where: { userId },
        order: { isDefault: 'DESC', createdAt: 'ASC' },
      });

      return addresses;
    } catch (error) {
      logger.error('Error getting user addresses:', error);
      throw error;
    }
  }

  /**
   * Update address
   */
  async updateAddress(userId: string, addressId: string, options: UpdateAddressOptions): Promise<Address> {
    logger.info('Updating address:', { userId, addressId });

    try {
      const address = await this.addressRepo.findOne({
        where: { id: addressId, userId },
      });

      if (!address) {
        throw new Error('Address not found');
      }

      // If setting as default, unset other default addresses
      if (options.isDefault) {
        await this.addressRepo.update(
          { userId, isDefault: true },
          { isDefault: false }
        );
      }

      // Update address fields
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined) {
          address[key] = options[key];
        }
      });

      const updatedAddress = await this.addressRepo.save(address);
      logger.info('Address updated successfully:', { addressId, userId });
      
      return updatedAddress;
    } catch (error) {
      logger.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    logger.info('Deleting address:', { userId, addressId });

    try {
      const result = await this.addressRepo.delete({
        id: addressId,
        userId,
      });

      if (result.affected === 0) {
        throw new Error('Address not found');
      }

      logger.info('Address deleted successfully:', { addressId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting address:', error);
      throw error;
    }
  }

  // ==================== LOYALTY PROGRAM MANAGEMENT ====================

  /**
   * Get user loyalty program
   */
  async getUserLoyaltyProgram(userId: string): Promise<LoyaltyProgram | null> {
    logger.info('Getting user loyalty program:', { userId });

    try {
      const loyaltyProgram = await this.loyaltyRepo.findOne({
        where: { userId },
      });

      return loyaltyProgram;
    } catch (error) {
      logger.error('Error getting user loyalty program:', error);
      throw error;
    }
  }

  /**
   * Add points to user loyalty program
   */
  async addLoyaltyPoints(userId: string, points: number): Promise<LoyaltyProgram> {
    logger.info('Adding loyalty points:', { userId, points });

    try {
      let loyaltyProgram = await this.getUserLoyaltyProgram(userId);

      if (!loyaltyProgram) {
        // Create loyalty program if it doesn't exist
        loyaltyProgram = LoyaltyProgram.create(userId);
        loyaltyProgram = await this.loyaltyRepo.save(loyaltyProgram);
      }

      const tierUpgraded = loyaltyProgram.addPoints(points);
      const updatedProgram = await this.loyaltyRepo.save(loyaltyProgram);

      if (tierUpgraded) {
        logger.info('User tier upgraded:', { userId, newTier: updatedProgram.tier });
      }

      logger.info('Loyalty points added successfully:', { userId, points, totalPoints: updatedProgram.points });
      return updatedProgram;
    } catch (error) {
      logger.error('Error adding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Deduct points from user loyalty program
   */
  async deductLoyaltyPoints(userId: string, points: number): Promise<LoyaltyProgram> {
    logger.info('Deducting loyalty points:', { userId, points });

    try {
      const loyaltyProgram = await this.getUserLoyaltyProgram(userId);

      if (!loyaltyProgram) {
        throw new Error('Loyalty program not found');
      }

      const success = loyaltyProgram.deductPoints(points);
      if (!success) {
        throw new Error('Insufficient points or invalid deduction');
      }

      const updatedProgram = await this.loyaltyRepo.save(loyaltyProgram);
      logger.info('Loyalty points deducted successfully:', { userId, points, totalPoints: updatedProgram.points });
      
      return updatedProgram;
    } catch (error) {
      logger.error('Error deducting loyalty points:', error);
      throw error;
    }
  }
}