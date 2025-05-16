import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AddressController } from '../controllers/address.controller';
import { AddressService } from '../services/address.service';
import { createAuthMiddleware } from '../middlewares/auth';

export function createAddressRouter(addressService: AddressService) {
  const addressController = new AddressController(addressService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication to all routes
    fastify.addHook('preHandler', createAuthMiddleware(addressService.dataSource));

    // Get all addresses for the current user
    fastify.get('/addresses', async (request: FastifyRequest, reply: FastifyReply) => {
      return addressController.getUserAddresses(request, reply);
    });

    // Create a new address
    fastify.post('/addresses', {
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        return addressController.createAddress(request, reply);
      }
    });

    // Update an address
    fastify.put('/addresses/:id', {
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return addressController.updateAddress(request, reply);
      }
    });

    // Delete an address
    fastify.delete('/addresses/:id', {
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return addressController.deleteAddress(request, reply);
      }
    });

    // Set default address
    fastify.put('/addresses/:id/default', {
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return addressController.setDefaultAddress(request, reply);
      }
    });
  };
} 