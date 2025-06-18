import fastify from 'fastify';
import { z } from 'zod';
import { AddressService } from '../services/address.service';
import { Address, AddressType } from '../entities/Address';
import { authGuard } from '../middlewares/authGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/dataSource';

// Type definitions to work with Fastify
type FastifyInstance = any;
type FastifyRequest = any;
type FastifyReply = any;

// Schemas for request validation
const addressCreateSchema = z.object({
  type: z.enum([AddressType.SHIPPING, AddressType.BILLING, AddressType.BOTH]),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  pincode: z.string().min(5, 'Valid pincode is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().length(2, 'Country code must be 2 characters'),
  landmark: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  additionalInfo: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

const addressUpdateSchema = addressCreateSchema.partial();

const addressParamsSchema = z.object({
  id: z.string().uuid('Invalid address ID format')
});

const addressQuerySchema = z.object({
  type: z.enum([AddressType.SHIPPING, AddressType.BILLING, AddressType.BOTH]).optional()
});

export class AddressController {
  private addressService: AddressService;
  private addressRepository: Repository<Address>;

  constructor() {
    this.addressService = new AddressService();
    this.addressRepository = AppDataSource.getRepository(Address);
  }

  /**
   * Register address routes
   * @param fastify - Fastify instance
   */
  async registerRoutes(fastify: FastifyInstance): Promise<void> {
    // Add authentication guard to all routes
    fastify.addHook('preHandler', authGuard);

    // Get all addresses for the authenticated user
    fastify.get(
      '/',
      { 
        schema: {
          tags: ['addresses'],
          summary: 'List user addresses',
          description: 'Get all addresses for the authenticated user',
          querystring: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: Object.values(AddressType),
                description: 'Filter addresses by type'
              }
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  pincode: { type: 'string' },
                  addressLine1: { type: 'string' },
                  addressLine2: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  isDefault: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        preHandler: validateRequest(addressQuerySchema, 'query')
      },
      this.listAddresses.bind(this)
    );

    // Get address by ID
    fastify.get('/:id', this.getAddressById.bind(this));

    // Create a new address
    fastify.post(
      '/',
      {
        schema: {
          tags: ['addresses'],
          summary: 'Create address',
          description: 'Create a new address for the authenticated user',
          body: {
            type: 'object',
            required: ['type', 'fullName', 'phone', 'pincode', 'addressLine1', 'city', 'state', 'country'],
            properties: {
              type: { 
                type: 'string', 
                enum: Object.values(AddressType) 
              },
              fullName: { type: 'string' },
              phone: { type: 'string' },
              pincode: { type: 'string' },
              addressLine1: { type: 'string' },
              addressLine2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              landmark: { type: 'string' },
              isDefault: { type: 'boolean' },
              additionalInfo: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              }
            }
          },
          response: {
            201: {
              description: 'Address created successfully',
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                fullName: { type: 'string' },
                // Other address properties
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        preHandler: validateRequest(addressCreateSchema)
      },
      this.createAddress.bind(this)
    );

    // Update an existing address
    fastify.put(
      '/:id',
      {
        schema: {
          tags: ['addresses'],
          summary: 'Update address',
          description: 'Update an existing address',
          params: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          },
          body: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: Object.values(AddressType) 
              },
              fullName: { type: 'string' },
              phone: { type: 'string' },
              pincode: { type: 'string' },
              addressLine1: { type: 'string' },
              addressLine2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              landmark: { type: 'string' },
              isDefault: { type: 'boolean' },
              additionalInfo: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              }
            }
          },
          response: {
            200: {
              description: 'Address updated successfully',
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                fullName: { type: 'string' },
                // Other address properties
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        preHandler: [
          validateRequest(addressParamsSchema, 'params'),
          validateRequest(addressUpdateSchema)
        ]
      },
      this.updateAddress.bind(this)
    );

    // Delete an address
    fastify.delete(
      '/:id',
      {
        schema: {
          tags: ['addresses'],
          summary: 'Delete address',
          description: 'Delete an address',
          params: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          },
          response: {
            200: {
              description: 'Address deleted successfully',
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        },
        preHandler: validateRequest(addressParamsSchema, 'params')
      },
      this.deleteAddress.bind(this)
    );

    // Set address as default
    fastify.patch(
      '/:id/default',
      {
        schema: {
          tags: ['addresses'],
          summary: 'Set default address',
          description: 'Set an address as the default for its type',
          params: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          },
          response: {
            200: {
              description: 'Address set as default successfully',
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                isDefault: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        },
        preHandler: validateRequest(addressParamsSchema, 'params')
      },
      this.setDefaultAddress.bind(this)
    );
  }

  /**
   * List all addresses
   */
  async listAddresses(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { type } = request.query;
      const addresses = await this.addressService.listAddresses(request.user.userId, type);
      
      return reply.code(200).send(addresses);
    } catch (error) {
      logger.error('Error listing addresses', error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params;
      const address = await this.addressService.getAddressById(id, request.user.userId);
      
      if (!address) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Address not found'
        });
      }
      
      return reply.code(200).send(address);
    } catch (error) {
      logger.error('Error getting address by ID', error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Create a new address
   */
  async createAddress(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const address = await this.addressService.createAddress(
        request.user.userId,
        request.body
      );
      
      return reply.code(201).send(address);
    } catch (error) {
      logger.error('Error creating address', error);
      return reply.code(500).send({ error: 'Internal Server Error', message: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params;
      
      try {
        const address = await this.addressService.updateAddress(
          id,
          request.user.userId,
          request.body
        );
        
        return reply.code(200).send(address);
      } catch (error) {
        if (error instanceof Error && error.message === 'Address not found') {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Address not found'
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error updating address', error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params;
      
      try {
        await this.addressService.deleteAddress(id, request.user.userId);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error && error.message === 'Address not found') {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Address not found'
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error deleting address', error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.userId) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params;
      
      try {
        // Check if address exists and belongs to the user
        const address = await this.addressRepository.findOne({
          where: {
            id,
            userId: request.user.id
          }
        });

        if (!address) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Address not found or does not belong to the user'
          });
        }

        // Unset any existing default of the same type
        await this.addressRepository.update(
          { userId: request.user.id, type: address.type, isDefault: true },
          { isDefault: false }
        );

        // Set this address as default
        await this.addressRepository.update(id, { isDefault: true });

        reply.code(200).send({
          id,
          type: address.type,
          isDefault: true,
          message: 'Address set as default successfully'
        });
      } catch (error) {
        logger.error({
          msg: 'Error setting default address',
          userId: request.user?.id,
          addressId: request.params.id,
          error: error instanceof Error ? error.message : String(error)
        });
        
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Error setting default address'
        });
      }
    } catch (error) {
      logger.error('Error setting default address', error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
} 