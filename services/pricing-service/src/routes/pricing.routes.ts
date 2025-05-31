import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { pricingController } from '@controllers/pricing.controller';
import { authGuard, AuthenticatedRequest } from '@middlewares/authGuard';

/**
 * Pricing routes
 */
export const pricingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Public routes
  fastify.get('/products/:id', {
    schema: {
      tags: ['public', 'pricing']
    },
    handler: pricingController.getProductPrice
  });
  
  fastify.get('/products', {
    schema: {
      tags: ['public', 'pricing']
    },
    handler: pricingController.getProductsPrices
  });
  
  fastify.get('/currencies', {
    schema: {
      tags: ['public', 'pricing']
    },
    handler: pricingController.getActiveCurrencies
  });

  // Protected routes (require authentication)
  fastify.register(async (protectedRoutes: FastifyInstance) => {
    // Add authentication middleware
    protectedRoutes.addHook('preHandler', authGuard);

    // Customer group specific routes
    protectedRoutes.get('/customer/pricelists', {
      schema: {
        tags: ['pricing']
      },
      handler: pricingController.getCustomerPriceLists
    });

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
      adminRoutes.get('/admin/pricelists', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.getAllPriceLists
      });
      
      adminRoutes.get('/admin/pricelists/:id', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.getPriceList
      });
      
      adminRoutes.post('/admin/pricelists', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.createPriceList
      });
      
      adminRoutes.put('/admin/pricelists/:id', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.updatePriceList
      });
      
      adminRoutes.delete('/admin/pricelists/:id', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.deletePriceList
      });
      
      adminRoutes.post('/admin/product', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.setProductPrice
      });
      
      adminRoutes.delete('/admin/product/:id', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.deleteProductPrice
      });
      
      adminRoutes.post('/admin/bulk/import', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.bulkImportPrices
      });
      
      adminRoutes.post('/admin/bulk/update', {
        schema: {
          tags: ['admin', 'pricing']
        },
        handler: pricingController.bulkUpdatePrices
      });
    });
  });
}; 