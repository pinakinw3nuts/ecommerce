import { FastifyInstance } from 'fastify';
import { AddressController } from '@controllers/address.controller';

export async function addressRoutes(fastify: FastifyInstance): Promise<void> {
  const addressController = new AddressController();
  
  // Register all address routes
  await addressController.registerRoutes(fastify);
} 