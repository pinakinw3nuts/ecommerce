import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { rateController } from '@controllers/rate.controller';
import { authGuard, AuthenticatedRequest } from '@middlewares/authGuard';

/**
 * Currency rate routes
 */
export const rateRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Public routes
  fastify.get('/', {
    schema: {
      tags: ['public', 'rates']
    },
    handler: rateController.getAllRates
  });
  
  fastify.get('/:code', {
    schema: {
      tags: ['public', 'rates']
    },
    handler: rateController.getRate
  });

  // Protected routes (require authentication)
  fastify.register(async (protectedRoutes: FastifyInstance) => {
    // Add authentication middleware
    protectedRoutes.addHook('preHandler', authGuard);

    // Admin routes (require admin role)
    protectedRoutes.register(async (adminRoutes: FastifyInstance) => {
      // Add admin role check middleware
      adminRoutes.addHook('preHandler', (request, reply, done) => {
        const user = (request as AuthenticatedRequest).user;
        if (!user || user.roles?.includes('admin') !== true) {
          reply.code(403).send({ error: 'Forbidden: Admin access required' });
          return;
        }
        done();
      });

      // Admin routes
      adminRoutes.post('/refresh', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.refreshRates
      });
      
      adminRoutes.get('/history', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.getRateHistory
      });
      
      adminRoutes.post('/set', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.setRate
      });
      
      adminRoutes.delete('/:baseCurrency/:targetCurrency', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.deleteRate
      });
      
      // Currency management
      adminRoutes.get('/currencies', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.getAllCurrencies
      });
      
      adminRoutes.post('/currencies', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.createOrUpdateCurrency
      });
      
      adminRoutes.put('/currencies/default/:code', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.setDefaultCurrency
      });
      
      adminRoutes.delete('/currencies/:code', {
        schema: {
          tags: ['admin', 'rates']
        },
        handler: rateController.deleteCurrency
      });
    });
  });
}; 