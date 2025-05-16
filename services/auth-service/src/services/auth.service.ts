import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole } from '../entities/user.entity';
import { comparePassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  RefreshTokenPayload
} from '../utils/jwt';
import { config } from '../config/env';
import logger from '../utils/logger';

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

  constructor(private userRepository: Repository<User>) {
    this.googleClient = new OAuth2Client(
      config.oauth.google.clientId,
      config.oauth.google.clientSecret
    );
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
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user with password
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        throw new AuthenticationError(
          'Invalid credentials',
          'INVALID_CREDENTIALS'
        );
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthenticationError(
          'Account is temporarily locked',
          'ACCOUNT_LOCKED',
          423
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        user.incrementFailedLoginAttempts();
        await this.userRepository.save(user);

        throw new AuthenticationError(
          'Invalid credentials',
          'INVALID_CREDENTIALS'
        );
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

      authLogger.info({ userId: user.id }, 'User logged in successfully');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      authLogger.error({ error, email }, 'Login failed');
      throw error;
    }
  }

  /**
   * Authenticate with Google OAuth
   */
  async googleLogin(idToken: string): Promise<LoginResponse> {
    try {
      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: config.oauth.google.clientId
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new AuthenticationError(
          'Invalid Google token',
          'INVALID_GOOGLE_TOKEN'
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
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = payload.sub;
          await this.userRepository.save(user);
        }
      } else {
        // Create new user
        user = this.userRepository.create({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          googleId: payload.sub,
          isEmailVerified: true,
          role: UserRole.USER
        });
        await this.userRepository.save(user);
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      authLogger.info({ userId: user.id }, 'User logged in via Google');

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      authLogger.error({ error }, 'Google login failed');
      throw error;
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
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): Partial<User> {
    return user.toJSON();
  }
} 