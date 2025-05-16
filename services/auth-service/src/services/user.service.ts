import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { comparePassword, hashPassword, validatePassword } from '../utils/password';
import logger from '../utils/logger';

const userLogger = logger.child({ module: 'user-service' });

export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id }
      });

      if (!user) {
        userLogger.warn({ userId: id }, 'User not found');
        return null;
      }

      return user;
    } catch (error) {
      userLogger.error({ error, userId: id }, 'Error finding user by ID');
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email }
      });

      if (!user) {
        userLogger.warn({ email }, 'User not found');
        return null;
      }

      return user;
    } catch (error) {
      userLogger.error({ error, email }, 'Error finding user by email');
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new UserServiceError(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }

      // Check email uniqueness if email is being updated
      if (data.email && data.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: data.email }
        });

        if (existingUser) {
          throw new UserServiceError(
            'Email already in use',
            'EMAIL_EXISTS',
            409
          );
        }

        // Reset email verification status when email changes
        user.isEmailVerified = false;
      }

      // Update user data
      Object.assign(user, {
        ...data,
        updatedAt: new Date()
      });

      await this.userRepository.save(user);

      userLogger.info({ userId }, 'User profile updated');

      return user;
    } catch (error) {
      userLogger.error({ error, userId, data }, 'Error updating user profile');
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new UserServiceError(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        data.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new UserServiceError(
          'Current password is incorrect',
          'INVALID_PASSWORD'
        );
      }

      // Validate new password
      const passwordValidation = validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        throw new UserServiceError(
          'Invalid new password: ' + passwordValidation.errors.join(', '),
          'INVALID_NEW_PASSWORD'
        );
      }

      // Ensure new password is different from current
      if (data.currentPassword === data.newPassword) {
        throw new UserServiceError(
          'New password must be different from current password',
          'SAME_PASSWORD'
        );
      }

      // Update password
      user.password = await hashPassword(data.newPassword);
      user.updatedAt = new Date();

      await this.userRepository.save(user);

      userLogger.info({ userId }, 'User password changed');
    } catch (error) {
      userLogger.error({ error, userId }, 'Error changing user password');
      throw error;
    }
  }

  /**
   * Enable/disable 2FA for user
   */
  async updateTwoFactorAuth(userId: string, enable: boolean): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new UserServiceError(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }

      user.is2FAEnabled = enable;
      user.updatedAt = new Date();

      if (!enable) {
        user.twoFactorSecret = null;
      }

      await this.userRepository.save(user);

      userLogger.info(
        { userId, enabled: enable },
        '2FA status updated'
      );

      return user;
    } catch (error) {
      userLogger.error(
        { error, userId, enable },
        'Error updating 2FA status'
      );
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
  }> {
    try {
      const [users, total] = await this.userRepository.findAndCount({
        where: { role },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC'
        }
      });

      return { users, total };
    } catch (error) {
      userLogger.error({ error, role }, 'Error finding users by role');
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: User[];
    total: number;
  }> {
    try {
      const [users, total] = await this.userRepository
        .createQueryBuilder('user')
        .where('user.name ILIKE :query OR user.email ILIKE :query', {
          query: `%${query}%`
        })
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('user.createdAt', 'DESC')
        .getManyAndCount();

      return { users, total };
    } catch (error) {
      userLogger.error({ error, query }, 'Error searching users');
      throw error;
    }
  }
} 