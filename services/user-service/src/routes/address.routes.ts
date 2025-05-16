import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AddressController } from '../controllers/address.controller';
import { AddressService } from '../services/address.service';

export function createAddressRouter(addressService: AddressService) {
  const addressController = new AddressController(addressService);
  
  return async function(fastify: FastifyInstance) {
    // Apply JWT authentication to all routes
    fastify.addHook('preHandler', async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
          return reply.status(401).send({ message: 'Authentication token is required' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
          return reply.status(401).send({ message: 'Invalid authentication format' });
        }

        // Verify JWT and get user
        try {
          const decoded = fastify.jwt.verify(token) as { id: string };
          const userRepository = addressService.dataSource.getRepository('User');
          const user = await userRepository.findOne({ where: { id: decoded.id } });

          if (!user) {
            return reply.status(401).send({ message: 'User not found' });
          }

          // Add user to request
          request.currentUser = {
            id: user.id,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          return reply.status(401).send({ message: 'Invalid or expired token' });
        }
      } catch (error) {
        return reply.status(401).send({ message: 'Authentication failed' });
      }
    });

    // Get all addresses for the current user
    fastify.get('/addresses', {
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        return addressController.getUserAddresses(request, reply);
      }
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