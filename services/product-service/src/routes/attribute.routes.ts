import { FastifyInstance } from 'fastify';
import { attributeController } from '../controllers/attribute.controller';

export async function attributeRoutes(fastify: FastifyInstance) {
  // Register only public routes if we're not in the protected context
  if (!fastify.hasDecorator('auth')) {
    await attributeController.registerPublicRoutes(fastify);
  } else {
    // Register only protected routes if we're in the protected context
    await attributeController.registerProtectedRoutes(fastify);
  }
} 