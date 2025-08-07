import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { User, UserRole, UserStatus } from '../entities/User';
import { logger } from '../utils/logger';
import { requireUser } from '../middleware/auth';
import { AddressType } from '../entities/Address';

const userService = new UserService();

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Zod schemas for validation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.object({
    newsletter: z.boolean().optional(),
    marketing: z.boolean().optional(),
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
    privacy: z.object({
      profileVisible: z.boolean().optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

const createAddressSchema = z.object({
  type: z.nativeEnum(AddressType),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street: z.string().min(1, 'Street address is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  phone: z.string().optional(),
  instructions: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

const userListQuerySchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val) || 1).optional().default(1),
  limit: z.string().or(z.number()).transform(val => Number(val) || 10).optional().default(10),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

const loyaltyPointsSchema = z.object({
  points: z.number().min(1, 'Points must be positive'),
});

export default async function usersRoutes(fastify: FastifyInstance) {
  // POST /api/users - Create user (public endpoint for registration)
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userData = createUserSchema.parse(request.body);
      
      logger.info('Creating new user:', { email: userData.email });

      const user = await userService.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        country: userData.country,
      });
      
      return reply.status(201).send({
        success: true,
        message: 'User created successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid user data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.status(409).send({
          success: false,
          message: error.message,
          error: 'USER_EXISTS',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create user',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // All routes below require authentication
  fastify.addHook('preHandler', requireUser());

  // GET /api/users/me - Get current user profile
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Getting current user profile:', { userId: user.userId });

      const userProfile = await userService.getUserById(user.userId, true);
      
      if (!userProfile) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }
      
      return reply.send({
        success: true,
        data: userProfile.toJSON(),
      });
    } catch (error) {
      logger.error('Error getting current user profile:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get user profile',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // PATCH /api/users/me - Update current user profile
  fastify.patch('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const updateData = updateUserSchema.parse(request.body);
      
      logger.info('Updating user profile:', { userId: user.userId });

      const updatedUser = await userService.updateUser(user.userId, {
        ...updateData,
        preferences: updateData.preferences ? {
          ...updateData.preferences,
          notifications: updateData.preferences.notifications ? {
            email: updateData.preferences.notifications.email || false,
            push: updateData.preferences.notifications.push || false,
            sms: updateData.preferences.notifications.sms || false,
          } : undefined,
          privacy: updateData.preferences.privacy ? {
            profileVisible: updateData.preferences.privacy.profileVisible || false,
            showEmail: updateData.preferences.privacy.showEmail || false,
            showPhone: updateData.preferences.privacy.showPhone || false,
          } : undefined,
        } : undefined,
      });
      
      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid update data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND',
        });
      }
      
      if (error instanceof Error && error.message.includes('already in use')) {
        return reply.status(409).send({
          success: false,
          message: error.message,
          error: 'EMAIL_IN_USE',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update profile',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // PUT /api/users/me/password - Update user password
  fastify.put('/me/password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const passwordData = updatePasswordSchema.parse(request.body);
      
      logger.info('Updating user password:', { userId: user.userId });

      await userService.updatePassword(user.userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      return reply.send({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      logger.error('Error updating user password:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid password data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('incorrect')) {
        return reply.status(400).send({
          success: false,
          message: error.message,
          error: 'INVALID_PASSWORD',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update password',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // ==================== ADDRESS MANAGEMENT ====================

  // GET /api/users/me/addresses - Get user addresses
  fastify.get('/me/addresses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Getting user addresses:', { userId: user.userId });

      const addresses = await userService.getUserAddresses(user.userId);
      
      return reply.send({
        success: true,
        data: addresses.map(addr => addr.toJSON()),
      });
    } catch (error) {
      logger.error('Error getting user addresses:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get addresses',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/users/me/addresses - Create address
  fastify.post('/me/addresses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const addressData = createAddressSchema.parse(request.body);
      
      logger.info('Creating user address:', { userId: user.userId, type: addressData.type });

      const address = await userService.createAddress(user.userId, {
        type: addressData.type,
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        street: addressData.street,
        apartment: addressData.apartment,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        postalCode: addressData.postalCode,
        phone: addressData.phone,
        instructions: addressData.instructions,
        isDefault: addressData.isDefault,
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Address created successfully',
        data: address.toJSON(),
      });
    } catch (error) {
      logger.error('Error creating user address:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid address data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to create address',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // PATCH /api/users/me/addresses/:id - Update address
  fastify.patch('/me/addresses/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: addressId } = request.params;
      const updateData = updateAddressSchema.parse(request.body);
      
      if (!isValidUUID(addressId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid address ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Updating user address:', { userId: user.userId, addressId });

      const address = await userService.updateAddress(user.userId, addressId, updateData);
      
      return reply.send({
        success: true,
        message: 'Address updated successfully',
        data: address.toJSON(),
      });
    } catch (error) {
      logger.error('Error updating user address:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid address data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Address not found',
          error: 'ADDRESS_NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update address',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // DELETE /api/users/me/addresses/:id - Delete address
  fastify.delete('/me/addresses/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      const { id: addressId } = request.params;
      
      if (!isValidUUID(addressId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid address ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Deleting user address:', { userId: user.userId, addressId });

      await userService.deleteAddress(user.userId, addressId);
      
      return reply.status(204).send();
    } catch (error) {
      logger.error('Error deleting user address:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'Address not found',
          error: 'ADDRESS_NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete address',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // ==================== LOYALTY PROGRAM ====================

  // GET /api/users/me/loyalty - Get loyalty program
  fastify.get('/me/loyalty', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      logger.info('Getting user loyalty program:', { userId: user.userId });

      const loyaltyProgram = await userService.getUserLoyaltyProgram(user.userId);
      
      if (!loyaltyProgram) {
        return reply.status(404).send({
          success: false,
          message: 'Loyalty program not found',
          error: 'LOYALTY_NOT_FOUND',
        });
      }
      
      return reply.send({
        success: true,
        data: loyaltyProgram.toJSON(),
      });
    } catch (error) {
      logger.error('Error getting user loyalty program:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get loyalty program',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // ==================== ADMIN ONLY ENDPOINTS ====================

  // All routes below require admin role
  fastify.addHook('preHandler', requireUser());

  // GET /api/users - List all users (admin only)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const queryParams = userListQuerySchema.parse(request.query);
      
      logger.info('Admin listing users:', { queryParams });

      const result = await userService.listUsers({
        ...queryParams,
        sortBy: queryParams.sortBy as keyof User || 'createdAt',
      });
      
      return reply.send({
        success: true,
        data: result.users.map(user => user.toJSON()),
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error listing users:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid query parameters',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to list users',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // GET /api/users/:id - Get user by ID (admin only)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id: userId } = request.params;
      
      if (!isValidUUID(userId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid user ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Admin getting user by ID:', { userId });

      const user = await userService.getUserById(userId, true);
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }
      
      return reply.send({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get user',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // PUT /api/users/:id/status - Update user status (admin only)
  fastify.put('/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id: userId } = request.params;
      const { status } = updateStatusSchema.parse(request.body);
      
      if (!isValidUUID(userId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid user ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Admin updating user status:', { userId, status });

      const user = await userService.updateUserStatus(userId, status);
      
      return reply.send({
        success: true,
        message: 'User status updated successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error updating user status:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid status data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update user status',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // POST /api/users/:id/loyalty/points - Add loyalty points (admin only)
  fastify.post('/:id/loyalty/points', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id: userId } = request.params;
      const { points } = loyaltyPointsSchema.parse(request.body);
      
      if (!isValidUUID(userId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid user ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Admin adding loyalty points:', { userId, points });

      const loyaltyProgram = await userService.addLoyaltyPoints(userId, points);
      
      return reply.send({
        success: true,
        message: 'Loyalty points added successfully',
        data: loyaltyProgram.toJSON(),
      });
    } catch (error) {
      logger.error('Error adding loyalty points:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid points data',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to add loyalty points',
        error: 'INTERNAL_ERROR',
      });
    }
  });

  // DELETE /api/users/:id - Delete user (admin only)
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id: userId } = request.params;
      
      if (!isValidUUID(userId)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid user ID format',
          error: 'INVALID_UUID',
        });
      }
      
      logger.info('Admin deleting user:', { userId });

      await userService.deleteUser(userId);
      
      return reply.status(204).send();
    } catch (error) {
      logger.error('Error deleting user:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete user',
        error: 'INTERNAL_ERROR',
      });
    }
  });
}