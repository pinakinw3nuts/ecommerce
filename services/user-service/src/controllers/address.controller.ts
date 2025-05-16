import { FastifyRequest, FastifyReply } from 'fastify';
import { AddressService } from '../services/address.service';
import logger from '../utils/logger';

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

export class AddressController {
  constructor(private addressService: AddressService) {}

  async getUserAddresses(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const addresses = await this.addressService.getUserAddresses(request.currentUser.id);
      return reply.send(addresses);
    } catch (error) {
      logger.error(error, 'Failed to get user addresses');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async createAddress(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const address = await this.addressService.createAddress(request.currentUser.id, request.body as any);
      return reply.status(201).send(address);
    } catch (error) {
      logger.error(error, 'Failed to create address');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async updateAddress(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const address = await this.addressService.updateAddress(
        request.params.id,
        request.currentUser.id,
        request.body as any
      );
      return reply.send(address);
    } catch (error) {
      logger.error(error, 'Failed to update address');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async deleteAddress(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      await this.addressService.deleteAddress(request.params.id, request.currentUser.id);
      return reply.status(204).send();
    } catch (error) {
      logger.error(error, 'Failed to delete address');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async setDefaultAddress(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.currentUser?.id) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const address = await this.addressService.setDefaultAddress(
        request.params.id,
        request.currentUser.id
      );
      return reply.send(address);
    } catch (error) {
      logger.error(error, 'Failed to set default address');
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }
} 