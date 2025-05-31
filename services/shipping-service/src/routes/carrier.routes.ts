import { FastifyInstance } from 'fastify';
import { CarrierRateController } from '../controllers/CarrierRateController';

/**
 * Register carrier routes
 * @param fastify Fastify instance
 */
export async function carrierRoutes(fastify: FastifyInstance): Promise<void> {
  const carrierRateController = new CarrierRateController();
  
  // Register all carrier rate routes
  await carrierRateController.registerRoutes(fastify);
} 