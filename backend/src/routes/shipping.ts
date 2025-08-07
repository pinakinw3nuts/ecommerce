import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ShippingService } from '../services/shipping.service';
import { requireUser, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

export async function shippingRoutes(fastify: FastifyInstance) {
  const shippingService = new ShippingService();

  // Public routes
  fastify.get('/rates', {
    schema: {
      querystring: z.object({
        originCountry: z.string(),
        originState: z.string().optional(),
        originCity: z.string().optional(),
        originPostalCode: z.string().optional(),
        destinationCountry: z.string(),
        destinationState: z.string().optional(),
        destinationCity: z.string().optional(),
        destinationPostalCode: z.string().optional(),
        weight: z.string().transform(val => parseFloat(val)),
        orderValue: z.string().transform(val => parseFloat(val)),
        itemCount: z.string().transform(val => parseInt(val)),
        insurance: z.string().optional().transform(val => val === 'true'),
        signature: z.string().optional().transform(val => val === 'true')
      })
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
          weight,
          category: undefined
        }],
        orderValue,
        itemCount,
        insurance,
        signature
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
      querystring: z.object({
        providerId: z.string().optional()
      })
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
      params: z.object({
        trackingNumber: z.string()
      })
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
      querystring: z.object({
        orderId: z.string().optional(),
        status: z.string().optional(),
        providerId: z.string().optional()
      })
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
      params: z.object({
        id: z.string()
      })
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
      params: z.object({
        id: z.string()
      })
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
      body: z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        website: z.string().optional(),
        credentials: z.record(z.any()).optional(),
        settings: z.record(z.any()).optional(),
        capabilities: z.record(z.any()).optional(),
        baseRate: z.number().default(0),
        handlingFee: z.number().default(0),
        priority: z.number().default(0)
      })
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
      querystring: z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        isActive: z.string().optional().transform(val => val === 'true')
      })
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
      params: z.object({
        id: z.string()
      })
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
      body: z.object({
        name: z.string(),
        type: z.string(),
        country: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        regions: z.array(z.string()).optional(),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
          radius: z.number()
        }).optional(),
        description: z.string().optional(),
        priority: z.number().default(0),
        restrictions: z.record(z.any()).optional()
      })
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
      querystring: z.object({
        type: z.string().optional(),
        country: z.string().optional(),
        isActive: z.string().optional().transform(val => val === 'true')
      })
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
      body: z.object({
        name: z.string(),
        type: z.string(),
        providerId: z.string(),
        description: z.string().optional(),
        iconUrl: z.string().optional(),
        estimatedDays: z.number().default(1),
        requiresSignature: z.boolean().default(false),
        requiresInsurance: z.boolean().default(false),
        isTrackable: z.boolean().default(false),
        isInternational: z.boolean().default(false),
        isLocalPickup: z.boolean().default(false),
        maxWeight: z.number().optional(),
        maxDimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number()
        }).optional(),
        restrictions: z.record(z.any()).optional(),
        features: z.record(z.any()).optional(),
        priority: z.number().default(0)
      })
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
      querystring: z.object({
        providerId: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        isActive: z.string().optional().transform(val => val === 'true')
      })
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
      body: z.object({
        providerId: z.string(),
        zoneId: z.string(),
        methodId: z.string(),
        rateType: z.string(),
        baseRate: z.number().default(0),
        additionalRate: z.number().default(0),
        handlingFee: z.number().default(0),
        insuranceFee: z.number().default(0),
        signatureFee: z.number().default(0),
        weightTiers: z.array(z.object({
          min: z.number(),
          max: z.number(),
          rate: z.number()
        })).optional(),
        distanceTiers: z.array(z.object({
          min: z.number(),
          max: z.number(),
          rate: z.number()
        })).optional(),
        minWeight: z.number().optional(),
        maxWeight: z.number().optional(),
        minDistance: z.number().optional(),
        maxDistance: z.number().optional(),
        minOrderValue: z.number().optional(),
        maxOrderValue: z.number().optional(),
        estimatedDays: z.number().default(1),
        priority: z.number().default(0),
        conditions: z.record(z.any()).optional()
      })
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
      querystring: z.object({
        providerId: z.string().optional(),
        zoneId: z.string().optional(),
        methodId: z.string().optional(),
        isActive: z.string().optional().transform(val => val === 'true')
      })
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
      body: z.object({
        orderId: z.string(),
        providerId: z.string(),
        methodId: z.string(),
        trackingNumber: z.string().optional(),
        cost: z.number(),
        weight: z.number(),
        dimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number()
        }).optional(),
        origin: z.object({
          name: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string(),
          country: z.string(),
          postalCode: z.string(),
          phone: z.string().optional()
        }),
        destination: z.object({
          name: z.string(),
          address: z.string(),
          city: z.string(),
          state: z.string(),
          country: z.string(),
          postalCode: z.string(),
          phone: z.string().optional()
        }),
        requiresSignature: z.boolean().optional(),
        hasInsurance: z.boolean().optional(),
        insuranceAmount: z.number().optional(),
        packages: z.array(z.any()).optional(),
        metadata: z.record(z.any()).optional()
      })
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
      params: z.object({
        id: z.string()
      }),
      body: z.object({
        status: z.string()
      })
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
      params: z.object({
        id: z.string()
      }),
      body: z.object({
        trackingNumber: z.string(),
        status: z.string(),
        location: z.string(),
        description: z.string(),
        timestamp: z.string().transform(val => new Date(val)),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        signedBy: z.string().optional(),
        isDelivered: z.boolean().optional(),
        isException: z.boolean().optional(),
        exceptionDetails: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional()
      })
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