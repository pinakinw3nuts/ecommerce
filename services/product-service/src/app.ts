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
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import fastifyStatic from '@fastify/static';
import fs from 'fs';

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

  // Register multipart for file uploads
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Get the path to the public directory
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  
  // Ensure the public directory exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
    console.log(`Created public directory at: ${publicPath}`);
  }
  
  // Ensure subdirectories exist
  const brandsPath = path.join(publicPath, 'brands');
  const categoriesPath = path.join(publicPath, 'categories');
  
  if (!fs.existsSync(brandsPath)) {
    fs.mkdirSync(brandsPath, { recursive: true });
    console.log(`Created brands directory at: ${brandsPath}`);
  }
  
  if (!fs.existsSync(categoriesPath)) {
    fs.mkdirSync(categoriesPath, { recursive: true });
    console.log(`Created categories directory at: ${categoriesPath}`);
  }
  
  // Log the contents of the public directory for debugging
  console.log('Public directory structure:');
  try {
    const publicDirContents = fs.readdirSync(publicPath);
    console.log(`${publicPath} contains:`, publicDirContents);
    
    // Check brands directory
    if (fs.existsSync(brandsPath)) {
      const brandsDirContents = fs.readdirSync(brandsPath);
      console.log(`${brandsPath} contains:`, brandsDirContents);
    }
    
    // Check categories directory
    if (fs.existsSync(categoriesPath)) {
      const categoriesDirContents = fs.readdirSync(categoriesPath);
      console.log(`${categoriesPath} contains:`, categoriesDirContents);
    }
  } catch (error) {
    console.error('Error reading directory structure:', error);
  }

  // Serve static files from public directory
  await app.register(fastifyStatic, {
    root: publicPath,
    prefix: '/public/',
    decorateReply: true,
  });
  
  // Add a route to test static file serving
  app.get('/test-static', (request, reply) => {
    reply.send({
      message: 'Static file test endpoint',
      publicPath,
      exists: fs.existsSync(publicPath),
      contents: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : []
    });
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