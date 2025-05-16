import { Repository, DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { User, UserStatus, Address, LoyaltyProgramEnrollment, LoyaltyTier, UserRole } from '../entities';
import logger from '../utils/logger';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';

export class UserService {
  private userRepo: Repository<User>;
  private addressRepo: Repository<Address>;
  private loyaltyRepo: Repository<LoyaltyProgramEnrollment>;

  constructor(public dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(User);
    this.addressRepo = dataSource.getRepository(Address);
    this.loyaltyRepo = dataSource.getRepository(LoyaltyProgramEnrollment);
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const existingUser = await this.userRepo.findOne({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hash(data.password, 10);

      // Create user
      const user = this.userRepo.create({
        ...data,
        password: hashedPassword,
        status: data.status || UserStatus.ACTIVE,
        role: data.role || UserRole.USER,
        preferences: {
          newsletter: false,
          marketing: false
        }
      });

      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      logger.info({ userId: user.id }, 'User created successfully');
      return user;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error({ error }, 'Failed to create user');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user by ID with optional relations
   */
  async getUserById(id: string, relations: string[] = []) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const user = await this.getUserById(id);

    const updatedUser = await this.userRepo.save({
      ...user,
      ...data
    });

    logger.info({ userId: id }, 'User updated successfully');
    return updatedUser;
  }

  /**
   * Change user status
   */
  async changeUserStatus(id: string, status: UserStatus) {
    const user = await this.getUserById(id);
    user.status = status;
    
    await this.userRepo.save(user);
    logger.info({ userId: id, status }, 'User status changed');
    
    return user;
  }

  /**
   * Get user profile
   */
  async getUserProfile(id: string) {
    return this.getUserById(id, ['addresses', 'loyaltyProgram']);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, data: any) {
    return this.updateUser(id, data);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(id: string, preferences: any) {
    const userData = await this.getUserById(id);
    userData.preferences = {
      ...userData.preferences,
      ...preferences
    };
    return this.updateUser(id, { preferences: userData.preferences });
  }

  /**
   * Add address to user
   */
  async addAddress(userId: string, addressData: Partial<Address>) {
    // Verify user exists
    await this.getUserById(userId);
    // If this is the first address or marked as default, unset other defaults
    if (addressData.isDefault) {
      await this.addressRepo.update(
        { userId },
        { isDefault: false }
      );
    }

    const address = this.addressRepo.create({
      ...addressData,
      userId
    });

    await this.addressRepo.save(address);
    logger.info({ userId, addressId: address.id }, 'Address added to user');

    return address;
  }

  /**
   * Enroll user in loyalty program
   */
  async enrollInLoyaltyProgram(userId: string) {
    const user = await this.getUserById(userId, ['loyaltyProgram']);
    // Check if already enrolled
    if (user.loyaltyProgram) {
      throw new Error('User is already enrolled in loyalty program');
    }

    const enrollment = this.loyaltyRepo.create({
      userId,
      tier: LoyaltyTier.BRONZE,
      points: 0,
      benefits: {
        freeShipping: false,
        birthdayBonus: true,
        exclusiveOffers: false,
        prioritySupport: false
      }
    });

    await this.loyaltyRepo.save(enrollment);
    logger.info({ userId }, 'User enrolled in loyalty program');

    return enrollment;
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(userId: string, points: number) {
    const enrollment = await this.loyaltyRepo.findOne({
      where: { userId }
    });

    if (!enrollment) {
      throw new Error('User is not enrolled in loyalty program');
    }

    enrollment.points += points;
    enrollment.lastPointsEarnedAt = new Date();

    // Check for tier upgrade
    if (enrollment.canUpgradeTier()) {
      // Logic for tier upgrade would go here
      // This would involve checking point thresholds and updating benefits
    }

    await this.loyaltyRepo.save(enrollment);
    logger.info({ userId, points, totalPoints: enrollment.points }, 'Loyalty points added');

    return enrollment;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    await this.userRepo.softRemove(user);
    
    logger.info({ userId: id }, 'User deleted');
    return true;
  }

  /**
   * Find users with filters
   */
  async findUsers(filters: {
    email?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const { email, status, page = 1, limit = 10 } = filters;

    const queryBuilder = this.userRepo.createQueryBuilder('user');

    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  /**
   * List users with pagination
   */
  async listUsers(page: number = 1, limit: number = 10): Promise<[User[], number]> {
    return this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC'
      }
    });
  }
} 