import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, UserStatus, UserRole } from '../entities/User';
import { logger } from '../utils/logger';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}



export default async function authRoutes(fastify: FastifyInstance) {
  // Debug route to test if auth routes are loaded
  fastify.get('/debug', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      message: 'Auth routes are loaded',
      routes: ['/login', '/register', '/refresh-token', '/me']
    });
  });

  // Login endpoint
  fastify.post('/login', async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required',
          error: 'MISSING_CREDENTIALS'
        });
      }

      // Query the database for the user
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { email: email.toLowerCase() },
        select: ['id', 'email', 'password', 'name', 'role', 'status', 'isEmailVerified']
      });

      if (!user) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        return reply.status(401).send({
          success: false,
          message: 'Account is not active',
          error: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Allow both USER and ADMIN roles to login
      // Admin-only restriction removed to fix critical business logic bug

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }, {
        expiresIn: '24h'
      });

      // Generate refresh token
      const refreshToken = fastify.jwt.sign({
        userId: user.id,
        type: 'refresh'
      }, {
        expiresIn: '7d'
      });

      // Return tokens in response body for now (without cookies)
      // TODO: Implement proper cookie handling

      logger.info({ userId: user.id, email: user.email, role: user.role }, 'User logged in successfully');

      return reply.send({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // Register endpoint
  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    try {
      const { email, password, name, role } = request.body;

      if (!email || !password || !name) {
        return reply.status(400).send({
          success: false,
          message: 'Email, password, and name are required',
          error: 'MISSING_CREDENTIALS'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return reply.status(400).send({
          success: false,
          message: 'Password must be at least 8 characters long',
          error: 'WEAK_PASSWORD'
        });
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          message: 'Email already registered',
          error: 'EMAIL_EXISTS'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const newUser = userRepository.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: role || UserRole.USER, // Default to USER role
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        is2faEnabled: false,
        phoneNumber: null,
        country: null,
        avatar: null,
        googleId: null,
        lastLogin: null,
        resetToken: undefined,
        resetTokenExpires: undefined,
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
        twoFactorSecret: null,
        emailVerifiedAt: undefined,
        preferences: null
      });

      const savedUser = await userRepository.save(newUser) as User;

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        name: savedUser.name
      }, {
        expiresIn: '24h'
      });

      // Generate refresh token
      const refreshToken = fastify.jwt.sign({
        userId: savedUser.id,
        type: 'refresh'
      }, {
        expiresIn: '7d'
      });

      logger.info({ userId: savedUser.id, email: savedUser.email }, 'New user registered successfully');

      return reply.status(201).send({
        success: true,
        message: 'Registration successful',
        token,
        refreshToken,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
          status: savedUser.status,
          isEmailVerified: savedUser.isEmailVerified
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Clear cookies when cookie support is added

      return reply.send({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh-token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Get refresh token from cookies when cookie support is added
      const refreshToken = (request.body as any)?.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          success: false,
          message: 'Refresh token not found',
          error: 'NO_REFRESH_TOKEN'
        });
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        return reply.status(401).send({
          success: false,
          message: 'Invalid refresh token',
          error: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Get user from database
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.userId }
      }) as User | null;

      if (!user || user.status !== UserStatus.ACTIVE) {
        return reply.status(401).send({
          success: false,
          message: 'User not found or inactive',
          error: 'USER_NOT_FOUND'
        });
      }

      // Generate new access token
      const newToken = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }, {
        expiresIn: '24h'
      });

      // TODO: Set new cookie when cookie support is added

      return reply.send({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newToken
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      return reply.status(401).send({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }
  });

  // Get current user endpoint
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      
      if (!user) {
        return reply.status(401).send({
          success: false,
          message: 'Not authenticated',
          error: 'NOT_AUTHENTICATED'
        });
      }

      return reply.send({
        success: true,
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });

    } catch (error) {
      logger.error('Get current user error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  });
} 