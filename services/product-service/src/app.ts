import fastify from 'fastify';
import { productRoutes } from './routes/product.routes';
import { categoryRoutes } from './routes/category.routes';
import { reviewRoutes } from './routes/review.routes';
import { attributeRoutes } from './routes/attribute.routes';
import { brandRoutes } from './routes/brand.routes';
import { swaggerConfig, swaggerUiOptions } from './config/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { authMiddleware } from './middlewares/auth';
import { couponController } from './controllers/coupon.controller';
import { tagController } from './controllers/tag.controller';
import fastifyCors from '@fastify/cors';

export async function buildApp() {
  const app = fastify({
    logger: true
  });

  // Register CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  });

  // Configure JSON serialization to handle circular references
  app.addHook('onSend', async (request, reply, payload) => {
    if (typeof payload !== 'string') {
      return payload;
    }
    
    try {
      // Parse the string payload to an object
      const parsedPayload = JSON.parse(payload);
      
      // Handle circular references in response by converting to JSON with a custom replacer
      const seen = new WeakSet();
      return JSON.stringify(parsedPayload, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      // If parsing fails, return the original payload
      console.error('Error processing JSON payload:', error);
      return payload;
    }
  });

  // Register Swagger
  await app.register(fastifySwagger, swaggerConfig);
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  console.log('Registering public routes...');

  // Register public routes with v1 prefix
  await app.register(async (publicApp) => {
    await publicApp.register(productRoutes, { prefix: '/products' });
    await publicApp.register(categoryRoutes, { prefix: '/categories' });
    await publicApp.register(reviewRoutes, { prefix: '/reviews' });
    await publicApp.register(attributeRoutes, { prefix: '/attributes' });
    await publicApp.register(brandRoutes, { prefix: '/brands' });
    await publicApp.register(couponController.registerPublicRoutes, { prefix: '/coupons' });
    await publicApp.register(tagController.registerPublicRoutes, { prefix: '/tags' });
    
    // Also register protected routes for tags directly under /api/v1/tags for admin authentication
    // This allows admin requests to work with both /api/v1/admin/tags and /api/v1/tags
    console.log('Registering protected routes for tags at /api/v1/tags (for admin authentication)');
    await publicApp.register(async (protectedTagsApp) => {
      // Add auth decorator
      protectedTagsApp.decorate('auth', true);
      
      // Add auth middleware
      protectedTagsApp.addHook('preHandler', authMiddleware);
      
      // Register protected routes for tags
      await protectedTagsApp.register(tagController.registerProtectedRoutes, { prefix: '' });
    }, { prefix: '/tags' });
    
    // Also register protected routes for coupons directly under /api/v1/coupons for admin authentication
    // This allows admin requests to work with both /api/v1/admin/coupons and /api/v1/coupons
    console.log('Registering protected routes for coupons at /api/v1/coupons (for admin authentication)');
    await publicApp.register(async (protectedCouponsApp) => {
      // Add auth decorator
      protectedCouponsApp.decorate('auth', true);
      
      // Add auth middleware
      protectedCouponsApp.addHook('preHandler', authMiddleware);
      
      // Register protected routes for coupons
      await protectedCouponsApp.register(couponController.registerProtectedRoutes, { prefix: '' });
    }, { prefix: '/coupons' });
    
    console.log('Public routes with v1 prefix registered successfully');
  }, { prefix: '/api/v1' });

  console.log('Registering protected routes...');

  // Register protected routes with auth middleware (with v1 prefix)
  await app.register(async (protectedApp) => {
    // Add auth decorator to indicate protected context
    protectedApp.decorate('auth', true);
    
    // Add auth middleware
    protectedApp.addHook('preHandler', authMiddleware);
    
    // Register protected routes with their specific prefixes
    console.log('Registering protected routes for products at /api/v1/admin/products');
    await protectedApp.register(productRoutes, { prefix: '/products' });
    
    console.log('Registering protected routes for categories at /api/v1/admin/categories');
    await protectedApp.register(categoryRoutes, { prefix: '/categories' });
    
    console.log('Registering protected routes for reviews at /api/v1/admin/reviews');
    await protectedApp.register(reviewRoutes, { prefix: '/reviews' });
    
    console.log('Registering protected routes for attributes at /api/v1/admin/attributes');
    await protectedApp.register(attributeRoutes, { prefix: '/attributes' });
    
    console.log('Registering protected routes for brands at /api/v1/admin/brands');
    await protectedApp.register(brandRoutes, { prefix: '/brands' });
    
    console.log('Registering protected routes for coupons at /api/v1/admin/coupons');
    await protectedApp.register(couponController.registerProtectedRoutes, { prefix: '/coupons' });
    
    console.log('Registering protected routes for tags at /api/v1/admin/tags');
    await protectedApp.register(tagController.registerProtectedRoutes, { prefix: '/tags' });
    
    console.log('Protected routes with v1 prefix registered successfully');
  }, { prefix: '/api/v1/admin' });

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