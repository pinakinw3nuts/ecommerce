import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { addressRoutes } from './routes/address.routes';
import { shippingRoutes } from './routes/shipping.routes';
import { carrierRoutes } from './routes/carrier.routes';
import { env } from './config/env';

export async function buildApp() {
  const app = fastify({
    logger: true
  });

  // Register CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  });

  // Configure JSON serialization to handle circular references
  app.addHook('onSend', async (request, reply, payload) => {
    // If payload is not a string or is empty, return as is
    if (typeof payload !== 'string' || !payload) {
      return payload;
    }
    
    // Get content type from headers
    const contentType = reply.getHeader('content-type')?.toString() || '';
    
    // Skip processing for non-JSON content
    if (contentType.includes('text/html') || 
        contentType.includes('text/javascript') ||
        contentType.includes('text/css') ||
        contentType.includes('image/') ||
        !contentType.includes('application/json')) {
      return payload;
    }
    
    // Skip processing if payload doesn't look like JSON
    const trimmedPayload = payload.trim();
    if (!(trimmedPayload.startsWith('{') || trimmedPayload.startsWith('[') || 
          trimmedPayload.startsWith('"') || trimmedPayload === 'null' || 
          trimmedPayload === 'true' || trimmedPayload === 'false' ||
          !isNaN(Number(trimmedPayload)))) {
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
    } catch (error: any) {
      // If parsing fails, return the original payload
      app.log.error(`Error processing JSON payload: ${error.message || 'Unknown error'}`);
      return payload;
    }
  });

  // Configure Swagger
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Shipping Service API',
        description: 'API for managing shipping addresses and calculating shipping rates and ETAs',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  // Register Swagger UI
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // Root route
  app.get('/', async () => {
    return { 
      service: 'Shipping Service',
      version: '1.0.0',
      status: 'running',
      docs: '/docs'
    };
  });

  console.log('Registering API routes...');

  // Register API routes with versioning
  await app.register(async (apiRoutes) => {
    // Register address routes
    await apiRoutes.register(addressRoutes, { prefix: '/addresses' });
    
    // Register shipping routes
    await apiRoutes.register(shippingRoutes, { prefix: '/shipping' });
    
    // Register carrier routes
    await apiRoutes.register(carrierRoutes, { prefix: '/carriers' });
    
    console.log('API routes registered successfully');
  }, { prefix: env.API_PREFIX });

  return app;
}

// Start the server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await buildApp();
      await app.listen({ port: env.PORT, host: '0.0.0.0' });
      app.log.info(`Server listening on port ${env.PORT}`);
    } catch (err: any) {
      console.error('Error starting server:', err.message);
      process.exit(1);
    }
  };
  start();
} 