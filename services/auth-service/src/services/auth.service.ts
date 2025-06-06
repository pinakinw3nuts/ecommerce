import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { comparePassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  RefreshTokenPayload
} from '../utils/jwt';
import { configTyped } from '../config/env';
import logger from '../utils/logger';
import { Redis } from 'ioredis';

const authLogger = logger.child({ module: 'auth-service' });

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private googleClient: OAuth2Client;
  private redis: Redis | null;

  constructor(private userRepository: Repository<User>, redis: Redis | null) {
    this.googleClient = new OAuth2Client(
      configTyped.oauth.google.clientId,
      configTyped.oauth.google.clientSecret
    );
    this.redis = redis;
  }

  /**
   * Create a new user account
   */
  async signup(data: SignupData): Promise<LoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new AuthenticationError(
          'Email already registered',
          'EMAIL_EXISTS',
          409
        );
      }

      // Create new user
      const user = this.userRepository.create({
        ...data,
        role: data.role || UserRole.USER,
        isEmailVerified: false
      });

      await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      authLogger.info({ userId: user.id }, 'New user registered');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      authLogger.error({ error, email: data.email }, 'Signup failed');
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string, requestedRole?: UserRole | string): Promise<LoginResponse> {
    try {
      if (!email || !password) {
        throw new AuthenticationError(
          'Email and password are required',
          'INVALID_CREDENTIALS',
          400
        );
      }

      logger.debug({ email, requestedRole }, 'Login attempt');

      // Find user with password
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        logger.debug({ email }, 'User not found');
        // Use same error message as invalid password for security
        throw new AuthenticationError(
          'Invalid credentials',
          'INVALID_CREDENTIALS'
        );
      }

      logger.debug({ 
        userId: user.id, 
        role: user.role,
        status: user.status,
        isLocked: user.isAccountLocked()
      }, 'User found');

      // Check if account is locked
      if (user.isAccountLocked()) {
        const lockTime = user.accountLockedUntil;
        logger.warn({ userId: user.id, lockTime }, 'Account is locked');
        throw new AuthenticationError(
          `Account is temporarily locked until ${lockTime?.toISOString()}`,
          'ACCOUNT_LOCKED',
          423
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      logger.debug({ userId: user.id, isPasswordValid }, 'Password verification result');

      if (!isPasswordValid) {
        user.incrementFailedLoginAttempts();
        await this.userRepository.save(user);

        const attemptsLeft = 5 - user.failedLoginAttempts;
        logger.warn({ 
          userId: user.id, 
          failedAttempts: user.failedLoginAttempts,
          attemptsLeft
        }, 'Invalid password');

        if (attemptsLeft > 0) {
          throw new AuthenticationError(
            `Invalid credentials. ${attemptsLeft} attempts remaining before account lockout.`,
            'INVALID_CREDENTIALS'
          );
        } else {
          throw new AuthenticationError(
            'Account has been locked due to too many failed attempts. Please try again later.',
            'ACCOUNT_LOCKED',
            423
          );
        }
      }

      // Validate role if requested
      if (requestedRole) {
        // Ensure we're comparing the same type (enum to enum)
        const roleToCheck = typeof requestedRole === 'string' ? requestedRole : String(requestedRole);
        const userRole = String(user.role);
        
        if (roleToCheck !== userRole) {
          logger.warn({ 
            userId: user.id, 
            userRole: user.role, 
            requestedRole 
          }, 'Insufficient permissions');

          throw new AuthenticationError(
            'Insufficient permissions for requested access',
            'INSUFFICIENT_PERMISSIONS',
            403
          );
        }
      }

      // Store the password before it gets removed
      const currentPassword = user.password;

      // Reset failed attempts and update last login
      user.resetFailedLoginAttempts();
      user.lastLogin = new Date();
      
      // Save with password preserved
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          failedLoginAttempts: user.failedLoginAttempts,
          lastLogin: user.lastLogin,
          accountLockedUntil: user.accountLockedUntil,
          password: currentPassword
        })
        .where('id = :id', { id: user.id })
        .execute();

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info({ userId: user.id }, 'User logged in successfully');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error({ error, email }, 'Login failed');
      throw new AuthenticationError(
        'An error occurred during login',
        'LOGIN_FAILED',
        500
      );
    }
  }

  /**
   * Authenticate with Google OAuth
   */
  async googleLogin(idToken: string): Promise<LoginResponse> {
    try {
      if (!idToken) {
        throw new AuthenticationError(
          'Google ID token is required',
          'INVALID_TOKEN',
          400
        );
      }

      // Verify Google token
      let ticket;
      try {
        ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: configTyped.oauth.google.clientId
        });
      } catch (error) {
        authLogger.error({ error }, 'Google token verification failed');
        throw new AuthenticationError(
          'Invalid or expired Google token',
          'INVALID_GOOGLE_TOKEN',
          401
        );
      }

      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new AuthenticationError(
          'Email not found in Google token',
          'INVALID_GOOGLE_TOKEN',
          400
        );
      }

      if (!payload.email_verified) {
        throw new AuthenticationError(
          'Google email is not verified',
          'EMAIL_NOT_VERIFIED',
          400
        );
      }

      // Find or create user
      let user = await this.userRepository.findOne({
        where: [
          { email: payload.email },
          { googleId: payload.sub }
        ]
      });

      if (user) {
        // Check if account is locked
        if (user.isAccountLocked()) {
          throw new AuthenticationError(
            'Account is temporarily locked',
            'ACCOUNT_LOCKED',
            423
          );
        }

        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = payload.sub;
          await this.userRepository.save(user);
          authLogger.info({ userId: user.id }, 'Updated user with Google ID');
        }
      } else {
        // Create new user
        user = this.userRepository.create({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          googleId: payload.sub,
          isEmailVerified: true,
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        });
        
        try {
          await this.userRepository.save(user);
          authLogger.info({ userId: user.id }, 'New user created via Google OAuth');
        } catch (error) {
          authLogger.error({ error, email: payload.email }, 'Failed to create user from Google OAuth');
          throw new AuthenticationError(
            'Failed to create user account',
            'USER_CREATION_FAILED',
            500
          );
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      authLogger.info({ userId: user.id }, 'User logged in via Google');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      authLogger.error({ error }, 'Google login failed');
      throw new AuthenticationError(
        'An error occurred during Google login',
        'GOOGLE_LOGIN_FAILED',
        500
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const { valid, expired, payload } = verifyToken<RefreshTokenPayload>(
        refreshToken,
        true
      );

      if (!valid || !payload) {
        throw new AuthenticationError(
          expired ? 'Refresh token expired' : 'Invalid refresh token',
          expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
        );
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new AuthenticationError('User not found', 'USER_NOT_FOUND');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      authLogger.info({ userId: user.id }, 'Tokens refreshed');

      return tokens;
    } catch (error) {
      authLogger.error({ error }, 'Token refresh failed');
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      }),
      signRefreshToken({
        userId: user.id,
        version: 1 // TODO: Implement token versioning
      })
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Authenticate admin user with email and password
   */
  async adminLogin(email: string, password: string): Promise<LoginResponse> {
    try {
      if (!email || !password) {
        throw new AuthenticationError(
          'Email and password are required',
          'INVALID_CREDENTIALS',
          400
        );
      }

      // Check cache first for admin user if Redis is available
      let user;
      const cachedUserKey = `admin:${email}`;
      
      if (this.redis) {
        try {
          const cachedUser = await this.redis.get(cachedUserKey);
          
          if (cachedUser) {
            // Use cached user data but still need to get password for verification
            const parsedUser = JSON.parse(cachedUser);
            
            // Get only the password from DB to verify
            const userWithPassword = await this.userRepository
              .createQueryBuilder('user')
              .where('user.id = :id', { id: parsedUser.id })
              .addSelect('user.password')
              .getOne();
            
            if (userWithPassword) {
              // Merge cached user with password for verification
              user = { ...parsedUser, password: userWithPassword.password };
            }
          }
        } catch (error) {
          logger.warn({ error }, 'Redis cache error, falling back to database');
        }
      }
      
      // If not in cache or password not found, do a full DB query
      if (!user) {
        user = await this.userRepository
          .createQueryBuilder('user')
          .where('user.email = :email', { email })
          .andWhere('user.role = :role', { role: UserRole.ADMIN })
          .addSelect('user.password')
          .getOne();
      }

      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug({ email }, 'Admin not found or user is not an admin');
        }
        throw new AuthenticationError(
          'Invalid admin credentials',
          'INVALID_CREDENTIALS'
        );
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const lockTime = user.accountLockedUntil;
        logger.warn({ userId: user.id, lockTime }, 'Admin account is locked');
        throw new AuthenticationError(
          `Account is temporarily locked until ${lockTime?.toISOString()}`,
          'ACCOUNT_LOCKED',
          423
        );
      }

      // Verify password with constant-time comparison
      const isPasswordValid = await comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        // Use a single transaction for updating failed attempts
        await this.userRepository.manager.transaction(async (manager) => {
          const userRepo = manager.getRepository(User);
          user.incrementFailedLoginAttempts();
          await userRepo.save(user);
        });

        const attemptsLeft = 3 - user.failedLoginAttempts;
        logger.warn({ 
          userId: user.id, 
          failedAttempts: user.failedLoginAttempts,
          attemptsLeft
        }, 'Invalid admin password');

        if (attemptsLeft > 0) {
          throw new AuthenticationError(
            `Invalid credentials. ${attemptsLeft} attempts remaining before account lockout.`,
            'INVALID_CREDENTIALS'
          );
        } else {
          throw new AuthenticationError(
            'Account has been locked due to too many failed attempts. Please contact support.',
            'ACCOUNT_LOCKED',
            423
          );
        }
      }

      // Use a single transaction for updating user login status
      await this.userRepository.manager.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        
        // Update user in a single query
        await userRepo.update(
          { id: user.id },
          {
            failedLoginAttempts: 0,
            lastLogin: new Date(),
            accountLockedUntil: null
          }
        );
      });

      // Generate tokens with admin-specific claims
      const tokens = await this.generateAdminTokens(user);

      // Cache admin user for future requests if Redis is available
      if (this.redis) {
        try {
          const userToCache = { ...user };
          delete userToCache.password;
          await this.redis.set(cachedUserKey, JSON.stringify(userToCache), 'EX', 3600); // Cache for 1 hour
        } catch (error) {
          logger.warn({ error }, 'Failed to cache admin user');
        }
      }

      logger.info({ userId: user.id }, 'Admin logged in successfully');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error({ error, email }, 'Admin login failed');
      throw new AuthenticationError(
        'An error occurred during admin login',
        'LOGIN_FAILED',
        500
      );
    }
  }

  /**
   * Generate admin-specific access and refresh tokens
   */
  private async generateAdminTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({
        userId: user.id,
        email: user.email,
        role: UserRole.ADMIN
      }),
      signRefreshToken({
        userId: user.id,
        version: 1
      })
    ]);

    return { 
      accessToken, 
      refreshToken,
      expiresIn: configTyped.jwt.expiresIn,
      refreshExpiresIn: configTyped.jwt.refreshExpiresIn
    };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): Partial<User> {
    return user.toJSON();
  }
} 