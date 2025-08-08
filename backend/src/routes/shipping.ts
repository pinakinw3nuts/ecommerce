import { FastifyInstance } from 'fastify';
import { ShippingService } from '../services/shipping.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

export async function shippingRoutes(fastify: FastifyInstance) {
  const shippingService = new ShippingService();

  // Public routes
  fastify.get('/rates', {
    schema: {
      querystring: {
        type: 'object',
        required: ['originCountry', 'destinationCountry', 'weight', 'orderValue', 'itemCount'],
        properties: {
          originCountry: { type: 'string' },
          originState: { type: 'string' },
          originCity: { type: 'string' },
          originPostalCode: { type: 'string' },
          destinationCountry: { type: 'string' },
          destinationState: { type: 'string' },
          destinationCity: { type: 'string' },
          destinationPostalCode: { type: 'string' },
          weight: { type: 'string' },
          orderValue: { type: 'string' },
          itemCount: { type: 'string' },
          insurance: { type: 'string' },
          signature: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const {
        originCountry,
        originState,
        originCity,
        originPostalCode,
        destinationCountry,
        destinationState,
        destinationCity,
        destinationPostalCode,
        weight,
        orderValue,
        itemCount,
        insurance,
        signature
      } = request.query as any;

      const rateRequest = {
        origin: {
          country: originCountry,
          state: originState,
          city: originCity,
          postalCode: originPostalCode
        },
        destination: {
          country: destinationCountry,
          state: destinationState,
          city: destinationCity,
          postalCode: destinationPostalCode
        },
        items: [{
          weight: parseFloat(weight),
          category: undefined
        }],
        orderValue: parseFloat(orderValue),
        itemCount: parseInt(itemCount),
        insurance: insurance === 'true',
        signature: signature === 'true'
      };

      const rates = await shippingService.calculateRates(rateRequest);
      return reply.send({ success: true, data: rates });
    } catch (error) {
      logger.error('Error calculating shipping rates:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to calculate shipping rates' 
      });
    }
  });

  fastify.get('/providers', async (request, reply) => {
    try {
      const providers = await shippingService.getAvailableProviders();
      return reply.send({ success: true, data: providers });
    } catch (error) {
      logger.error('Error fetching shipping providers:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping providers' 
      });
    }
  });

  fastify.get('/methods', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId } = request.query as any;
      const methods = await shippingService.getAvailableMethods(providerId);
      return reply.send({ success: true, data: methods });
    } catch (error) {
      logger.error('Error fetching shipping methods:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping methods' 
      });
    }
  });

  fastify.get('/tracking/:trackingNumber', {
    schema: {
      params: {
        type: 'object',
        required: ['trackingNumber'],
        properties: {
          trackingNumber: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { trackingNumber } = request.params as any;
      const tracking = await shippingService.getTrackingByNumber(trackingNumber);
      return reply.send({ success: true, data: tracking });
    } catch (error) {
      logger.error('Error fetching tracking information:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch tracking information' 
      });
    }
  });

  // Authenticated routes
  fastify.get('/shipments', {
    preHandler: requireUser,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          status: { type: 'string' },
          providerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { orderId, status, providerId } = request.query as any;
      const shipments = await shippingService.getShipments({ orderId, status, providerId });
      return reply.send({ success: true, data: shipments });
    } catch (error) {
      logger.error('Error fetching shipments:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipments' 
      });
    }
  });

  fastify.get('/shipments/:id', {
    preHandler: requireUser,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const shipment = await shippingService.getShipmentById(id);
      
      if (!shipment) {
        return reply.status(404).send({ 
          success: false, 
          error: 'Shipment not found' 
        });
      }

      return reply.send({ success: true, data: shipment });
    } catch (error) {
      logger.error('Error fetching shipment:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipment' 
      });
    }
  });

  fastify.get('/shipments/:id/tracking', {
    preHandler: requireUser,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const tracking = await shippingService.getTrackingHistory(id);
      return reply.send({ success: true, data: tracking });
    } catch (error) {
      logger.error('Error fetching tracking history:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch tracking history' 
      });
    }
  });

  // Admin routes
  fastify.post('/admin/providers', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' },
          logoUrl: { type: 'string' },
          website: { type: 'string' },
          credentials: { type: 'object' },
          settings: { type: 'object' },
          capabilities: { type: 'object' },
          baseRate: { type: 'number', default: 0 },
          handlingFee: { type: 'number', default: 0 },
          priority: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const provider = await shippingService.createProvider(request.body as any);
      return reply.status(201).send({ success: true, data: provider });
    } catch (error) {
      logger.error('Error creating shipping provider:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create shipping provider' 
      });
    }
  });

  fastify.get('/admin/providers', {
    preHandler: requireAdmin,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          status: { type: 'string' },
          isActive: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type, status, isActive } = request.query as any;
      const providers = await shippingService.getProviders({ type, status, isActive });
      return reply.send({ success: true, data: providers });
    } catch (error) {
      logger.error('Error fetching shipping providers:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping providers' 
      });
    }
  });

  fastify.get('/admin/providers/:id', {
    preHandler: requireAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const provider = await shippingService.getProviderById(id);
      
      if (!provider) {
        return reply.status(404).send({ 
          success: false, 
          error: 'Provider not found' 
        });
      }

      return reply.send({ success: true, data: provider });
    } catch (error) {
      logger.error('Error fetching shipping provider:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping provider' 
      });
    }
  });

  fastify.post('/admin/zones', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          country: { type: 'string' },
          state: { type: 'string' },
          city: { type: 'string' },
          postalCode: { type: 'string' },
          regions: { type: 'array', items: { type: 'string' } },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              radius: { type: 'number' }
            }
          },
          description: { type: 'string' },
          priority: { type: 'number', default: 0 },
          restrictions: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const zone = await shippingService.createZone(request.body as any);
      return reply.status(201).send({ success: true, data: zone });
    } catch (error) {
      logger.error('Error creating shipping zone:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create shipping zone' 
      });
    }
  });

  fastify.get('/admin/zones', {
    preHandler: requireAdmin,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          country: { type: 'string' },
          isActive: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type, country, isActive } = request.query as any;
      const zones = await shippingService.getZones({ type, country, isActive });
      return reply.send({ success: true, data: zones });
    } catch (error) {
      logger.error('Error fetching shipping zones:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping zones' 
      });
    }
  });

  fastify.post('/admin/methods', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'type', 'providerId'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          providerId: { type: 'string' },
          description: { type: 'string' },
          iconUrl: { type: 'string' },
          estimatedDays: { type: 'number', default: 1 },
          requiresSignature: { type: 'boolean', default: false },
          requiresInsurance: { type: 'boolean', default: false },
          isTrackable: { type: 'boolean', default: false },
          isInternational: { type: 'boolean', default: false },
          isLocalPickup: { type: 'boolean', default: false },
          maxWeight: { type: 'number' },
          maxDimensions: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' }
            }
          },
          restrictions: { type: 'object' },
          features: { type: 'object' },
          priority: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const method = await shippingService.createMethod(request.body as any);
      return reply.status(201).send({ success: true, data: method });
    } catch (error) {
      logger.error('Error creating shipping method:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create shipping method' 
      });
    }
  });

  fastify.get('/admin/methods', {
    preHandler: requireAdmin,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          isActive: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId, type, status, isActive } = request.query as any;
      const methods = await shippingService.getMethods({ providerId, type, status, isActive });
      return reply.send({ success: true, data: methods });
    } catch (error) {
      logger.error('Error fetching shipping methods:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping methods' 
      });
    }
  });

  fastify.post('/admin/rates', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['providerId', 'zoneId', 'methodId', 'rateType'],
        properties: {
          providerId: { type: 'string' },
          zoneId: { type: 'string' },
          methodId: { type: 'string' },
          rateType: { type: 'string' },
          baseRate: { type: 'number', default: 0 },
          additionalRate: { type: 'number', default: 0 },
          handlingFee: { type: 'number', default: 0 },
          insuranceFee: { type: 'number', default: 0 },
          signatureFee: { type: 'number', default: 0 },
          weightTiers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                rate: { type: 'number' }
              }
            }
          },
          distanceTiers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                rate: { type: 'number' }
              }
            }
          },
          minWeight: { type: 'number' },
          maxWeight: { type: 'number' },
          minDistance: { type: 'number' },
          maxDistance: { type: 'number' },
          minOrderValue: { type: 'number' },
          maxOrderValue: { type: 'number' },
          estimatedDays: { type: 'number', default: 1 },
          priority: { type: 'number', default: 0 },
          conditions: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const rate = await shippingService.createRate(request.body as any);
      return reply.status(201).send({ success: true, data: rate });
    } catch (error) {
      logger.error('Error creating shipping rate:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create shipping rate' 
      });
    }
  });

  fastify.get('/admin/rates', {
    preHandler: requireAdmin,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          zoneId: { type: 'string' },
          methodId: { type: 'string' },
          isActive: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { providerId, zoneId, methodId, isActive } = request.query as any;
      const rates = await shippingService.getRates({ providerId, zoneId, methodId, isActive });
      return reply.send({ success: true, data: rates });
    } catch (error) {
      logger.error('Error fetching shipping rates:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to fetch shipping rates' 
      });
    }
  });

  fastify.post('/admin/shipments', {
    preHandler: requireAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['orderId', 'providerId', 'methodId'],
        properties: {
          orderId: { type: 'string' },
          providerId: { type: 'string' },
          methodId: { type: 'string' },
          trackingNumber: { type: 'string' },
          cost: { type: 'number' },
          weight: { type: 'number' },
          dimensions: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' }
            }
          },
          origin: {
            type: 'object',
            required: ['name', 'address', 'city', 'state', 'country', 'postalCode'],
            properties: {
              name: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          destination: {
            type: 'object',
            required: ['name', 'address', 'city', 'state', 'country', 'postalCode'],
            properties: {
              name: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          requiresSignature: { type: 'boolean' },
          hasInsurance: { type: 'boolean' },
          insuranceAmount: { type: 'number' },
          packages: { type: 'array', items: { type: 'object' } },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const shipment = await shippingService.createShipment(request.body as any);
      return reply.status(201).send({ success: true, data: shipment });
    } catch (error) {
      logger.error('Error creating shipment:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to create shipment' 
      });
    }
  });

  fastify.put('/admin/shipments/:id/status', {
    preHandler: requireAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { status } = request.body as any;
      
      const shipment = await shippingService.updateShipmentStatus(id, status);
      return reply.send({ success: true, data: shipment });
    } catch (error) {
      logger.error('Error updating shipment status:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to update shipment status' 
      });
    }
  });

  fastify.post('/admin/shipments/:id/tracking', {
    preHandler: requireAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['trackingNumber', 'status', 'location', 'description', 'timestamp'],
        properties: {
          trackingNumber: { type: 'string' },
          status: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          timestamp: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          postalCode: { type: 'string' },
          signedBy: { type: 'string' },
          isDelivered: { type: 'boolean' },
          isException: { type: 'boolean' },
          exceptionDetails: { type: 'object' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const tracking = await shippingService.addTrackingEvent(id, request.body as any);
      return reply.status(201).send({ success: true, data: tracking });
    } catch (error) {
      logger.error('Error adding tracking event:', error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to add tracking event' 
      });
    }
  });
} 