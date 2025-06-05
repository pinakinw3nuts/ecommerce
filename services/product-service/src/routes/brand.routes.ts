import { FastifyInstance } from 'fastify';
import { brandController } from '../controllers/brand.controller';

export async function brandRoutes(fastify: FastifyInstance) {
  // Check if we're in a protected context (has auth decorator)
  const isProtected = fastify.hasDecorator('auth');
  
  if (isProtected) {
    // Register only protected routes if we're in the protected context
    console.log('Registering protected brand routes in brand.routes.ts');
    await brandController.registerProtectedRoutes(fastify);
  } else {
    // Register only public routes if we're not in the protected context
    console.log('Registering public brand routes in brand.routes.ts');
    await brandController.registerPublicRoutes(fastify);
  }
} 