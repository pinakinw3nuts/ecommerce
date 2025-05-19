import fastify from 'fastify';
import { productRoutes } from './routes/product.routes';
import { categoryRoutes } from './routes/category.routes';
import { reviewRoutes } from './routes/review.routes';
import { attributeRoutes } from './routes/attribute.routes';
import { swaggerConfig, swaggerUiOptions } from './config/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { authMiddleware } from './middlewares/auth';
import { productController } from './controllers/product.controller';
import { categoryController } from './controllers/category.controller';
import { reviewController } from './controllers/review.controller';
import { attributeController } from './controllers/attribute.controller';
import { brandController } from './controllers/brand.controller';
import { couponController } from './controllers/coupon.controller';

export async function buildApp() {
  const app = fastify({
    logger: true
  });

  // Register Swagger
  await app.register(fastifySwagger, swaggerConfig);
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  console.log('Registering public routes...');

  // Register public routes
  await app.register(async (publicApp) => {
    await publicApp.register(productRoutes, { prefix: '/products' });
    await publicApp.register(categoryRoutes, { prefix: '/categories' });
    await publicApp.register(reviewRoutes, { prefix: '/reviews' });
    await publicApp.register(attributeRoutes, { prefix: '/attributes' });
    await publicApp.register(brandController.registerPublicRoutes, { prefix: '/brands' });
    await publicApp.register(couponController.registerPublicRoutes, { prefix: '/coupons' });
    console.log('Public routes registered successfully');
  }, { prefix: '/api/v1' });

  console.log('Registering protected routes...');

  // Register protected routes with auth middleware
  await app.register(async (protectedApp) => {
    // Add auth decorator to indicate protected context
    protectedApp.decorate('auth', true);
    
    // Add auth middleware
    protectedApp.addHook('preHandler', authMiddleware);
    
    // Register protected routes with their specific prefixes
    await protectedApp.register(productRoutes, { prefix: '/products' });
    await protectedApp.register(categoryRoutes, { prefix: '/categories' });
    await protectedApp.register(reviewRoutes, { prefix: '/reviews' });
    await protectedApp.register(attributeRoutes, { prefix: '/attributes' });
    await protectedApp.register(brandController.registerProtectedRoutes, { prefix: '/brands' });
    await protectedApp.register(couponController.registerProtectedRoutes, { prefix: '/coupons' });
    console.log('Protected routes registered successfully');
  }, { prefix: '/api/v1' });

  return app;
}

// Start the server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await buildApp();
      await app.listen({ port: 3000 });
      app.log.info('Server listening on port 3000');
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };
  start();
} 