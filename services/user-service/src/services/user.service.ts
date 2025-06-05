import { Repository, DataSource } from 'typeorm';
import { hash  } from 'bcryptjs';
import { User, UserStatus, Address, LoyaltyProgramEnrollment, LoyaltyTier, UserRole } from '../entities';
import logger from '../utils/logger';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  country?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  phoneNumber?: string;
  country?: string;
  isEmailVerified?: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: keyof User;
  sortOrder?: 'ASC' | 'DESC';
}

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
        role: data.role || UserRole.USER
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
    throw new Error('Preferences are not supported');
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

  /**
   * Find users with advanced filters
   */
  async findUsersWithFilters(filters: {
    page?: number;
    limit?: number;
    search?: string;
    roles?: string[];
    statuses?: string[];
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    country?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      roles,
      statuses,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      country
    } = filters;

    const queryBuilder = this.userRepo.createQueryBuilder('user');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply role filter
    if (roles?.length) {
      queryBuilder.andWhere('user.role IN (:...roles)', { roles });
    }

    // Apply status filter
    if (statuses?.length) {
      queryBuilder.andWhere('user.status IN (:...statuses)', { statuses });
    }

    // Apply country filter
    if (country) {
      queryBuilder.andWhere('user.country = :country', { country });
    }

    // Apply date range filter
    if (dateFrom) {
      queryBuilder.andWhere('user.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('user.createdAt <= :dateTo', { dateTo });
    }

    // Apply pagination
    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasMore: page < Math.ceil(total / limit),
        hasPrevious: page > 1
      }
    };
  }

  async create(data: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const user = this.userRepo.create({
      ...data,
      password: await hash(data.password, 10),
      status: UserStatus.PENDING,
    });

    return this.userRepo.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new BadRequestError('Email already in use');
      }
    }

    if (data.password) {
      data.password = await hash(data.password, 10);
    }

    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepo.remove(user);
  }

  async list(params: UserListParams = {}) {
    const {
      page = 1,
      pageSize = 10,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = params;

    try {
      // First, check if the table exists
      const tableExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);

      if (!tableExists[0].exists) {
        return {
          users: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // Then, check what columns exist
      const columns = await this.dataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users';
      `);

      const existingColumns = columns.map(col => col.column_name);
      logger.debug('Existing columns:', existingColumns);

      const query = this.userRepo.createQueryBuilder('user');

      // Build the select array
      const selectColumns = ['user.id'];
      
      if (existingColumns.includes('created_at')) {
        selectColumns.push('user.created_at');
      }
      if (existingColumns.includes('updated_at')) {
        selectColumns.push('user.updated_at');
      }
      if (existingColumns.includes('name')) {
        selectColumns.push('user.name');
      }
      if (existingColumns.includes('email')) {
        selectColumns.push('user.email');
      }
      if (existingColumns.includes('role')) {
        selectColumns.push('user.role');
      }
      if (existingColumns.includes('status')) {
        selectColumns.push('user.status');
      }
      if (existingColumns.includes('is_email_verified')) {
        selectColumns.push('user.is_email_verified');
      }
      if (existingColumns.includes('phone_number')) {
        selectColumns.push('user.phone_number');
      }
      if (existingColumns.includes('country')) {
        selectColumns.push('user.country');
      }
      if (existingColumns.includes('last_login')) {
        selectColumns.push('user.last_login');
      }

      logger.debug('Selected columns:', selectColumns);

      // Apply the select columns
      query.select(selectColumns);

      // Add search condition if name and email columns exist
      if (search && existingColumns.includes('name') && existingColumns.includes('email')) {
        query.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Add role filter if role column exists
      if (role && existingColumns.includes('role')) {
        query.andWhere('user.role = :role', { role });
      }

      // Add status filter if status column exists
      if (status && existingColumns.includes('status')) {
        query.andWhere('user.status = :status', { status });
      }

      // Apply sorting
      const snakeCaseColumn = this.toSnakeCase(sortBy);
      if (existingColumns.includes(snakeCaseColumn)) {
        query.orderBy(`user.${snakeCaseColumn}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
      } else {
        query.orderBy('user.created_at', sortOrder.toUpperCase() as 'ASC' | 'DESC');
      }

      // Add pagination
      query.skip((page - 1) * pageSize)
        .take(pageSize);

      // Log the generated query
      logger.debug('Generated SQL query:', query.getQuery());

      const [users, total] = await query.getManyAndCount();
      
      // Map snake_case column names to camelCase
      const mappedUsers = users.map(user => {
        const rawUser = user as any;
        const mappedUser: Partial<User> = {
          id: rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role,
          status: rawUser.status,
          country: rawUser.country,
          createdAt: rawUser.created_at,
          updatedAt: rawUser.updated_at,
          isEmailVerified: rawUser.is_email_verified,
          phoneNumber: rawUser.phone_number,
          lastLogin: rawUser.last_login
        };
        return mappedUser;
      });

      // Log the results
      logger.debug('Query results:', { total, userCount: mappedUsers.length, firstUser: mappedUsers[0] });

      return {
        users: mappedUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      logger.error(error, 'Failed to list users');
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  // Helper method to convert camelCase to snake_case
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepo.update(id, {
      lastLogin: new Date(),
    });
  }

  async verifyEmail(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    return this.userRepo.save(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.userRepo.save(user);
  }
} 