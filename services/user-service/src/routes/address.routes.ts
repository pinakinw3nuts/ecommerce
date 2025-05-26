import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AddressController } from '../controllers/address.controller';
import { AddressService } from '../services/address.service';
import { createAuthMiddleware } from '../middlewares/auth';
import { FastifySchema } from 'fastify';
import { SwaggerOptions } from '@fastify/swagger';

// Define the Address response schema
const addressResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    street: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    country: { type: 'string' },
    postalCode: { type: 'string' },
    isDefault: { type: 'boolean' },
    apartment: { type: 'string' },
    instructions: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export function createAddressRouter(addressService: AddressService) {
  const addressController = new AddressController(addressService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication to all routes
    fastify.addHook('preHandler', createAuthMiddleware(addressService.dataSource));

    // Get all addresses for the current user
    const getAllAddressesOpts = {
      schema: {
        operationId: 'getAllAddresses',
        tags: ['addresses'] as string[],
        summary: 'List user addresses',
        description: 'Get all addresses for the authenticated user',
        security: [{ bearerAuth: [] }] as { bearerAuth: string[] }[],
        response: {
          200: {
            description: 'List of addresses',
            type: 'array',
            items: addressResponseSchema
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    } as const;

    fastify.get('/addresses', getAllAddressesOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      return addressController.getUserAddresses(request, reply);
    });

    // Create a new address
    const createAddressOpts = {
      schema: {
        tags: ['addresses'] as string[],
        summary: 'Create address',
        description: 'Create a new address for the authenticated user',
        security: [{ bearerAuth: [] }] as { bearerAuth: string[] }[],
        body: {
          type: 'object',
          required: ['street', 'city', 'state', 'country', 'postalCode'],
          properties: {
            street: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State/Province' },
            country: { type: 'string', description: 'Country name' },
            postalCode: { type: 'string', description: 'Postal/ZIP code' },
            isDefault: { type: 'boolean', description: 'Set as default address' },
            apartment: { type: 'string', description: 'Apartment/Suite number' },
            instructions: { type: 'string', description: 'Delivery instructions' }
          }
        },
        response: {
          201: {
            description: 'Address created successfully',
            ...addressResponseSchema
          },
          400: {
            description: 'Bad Request - Invalid input data',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    } as const;

    fastify.post('/addresses', createAddressOpts, async (request: FastifyRequest, reply: FastifyReply) => {
      return addressController.createAddress(request, reply);
    });

    // Update an address
    const updateAddressOpts = {
      schema: {
        tags: ['addresses'] as string[],
        summary: 'Update address',
        description: 'Update an existing address',
        security: [{ bearerAuth: [] }] as { bearerAuth: string[] }[],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Address ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            street: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State/Province' },
            country: { type: 'string', description: 'Country name' },
            postalCode: { type: 'string', description: 'Postal/ZIP code' },
            isDefault: { type: 'boolean', description: 'Set as default address' },
            apartment: { type: 'string', description: 'Apartment/Suite number' },
            instructions: { type: 'string', description: 'Delivery instructions' }
          }
        },
        response: {
          200: {
            description: 'Address updated successfully',
            ...addressResponseSchema
          },
          400: {
            description: 'Bad Request - Invalid input data',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Address not found',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    } as const;

    fastify.put('/addresses/:id', updateAddressOpts, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      return addressController.updateAddress(request, reply);
    });

    // Delete an address
    const deleteAddressOpts = {
      schema: {
        tags: ['addresses'] as string[],
        summary: 'Delete address',
        description: 'Delete an existing address',
        security: [{ bearerAuth: [] }] as { bearerAuth: string[] }[],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Address ID to delete' }
          }
        },
        response: {
          204: {
            description: 'Address deleted successfully',
            type: 'null'
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Address not found',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    } as const;

    fastify.delete('/addresses/:id', deleteAddressOpts, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      return addressController.deleteAddress(request, reply);
    });

    // Set default address
    const setDefaultAddressOpts = {
      schema: {
        tags: ['addresses'] as string[],
        summary: 'Set default address',
        description: 'Set an address as the default shipping address',
        security: [{ bearerAuth: [] }] as { bearerAuth: string[] }[],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Address ID to set as default' }
          }
        },
        response: {
          200: {
            description: 'Address set as default successfully',
            ...addressResponseSchema
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Address not found',
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    } as const;

    fastify.put('/addresses/:id/default', setDefaultAddressOpts, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      return addressController.setDefaultAddress(request, reply);
    });
  };
} 