import fastify from 'fastify';
import { z } from 'zod';
import { ShippingService } from '../services/shipping.service';
import { validateRequest } from '../middlewares/validateRequest';
import { logger } from '../utils/logger';
import {
  Entity,
  Repository,
  In
} from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { ShippingMethod } from '../entities/ShippingMethod';
import { ShippingZone } from '../entities/ShippingZone';
import { ShippingRate } from '../entities/ShippingRate';
import { calculateETA } from '../utils/eta';
import { FastifyRequest as FastifyRequestBase } from 'fastify';
import { authenticate, authorize } from '../middlewares/auth';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Type definitions to work with Fastify
type FastifyInstance = any;
type FastifyRequest = any;
type FastifyReply = any;

// Schemas for request validation
const etaCalculationSchema = z.object({
  pincode: z.string().min(5, 'Valid pincode is required'),
  methodId: z.string().uuid('Invalid shipping method ID format').optional(),
  methodCode: z.string().optional(),
  weight: z.number().optional(),
  orderValue: z.number().optional(),
  productCategories: z.array(z.string()).optional(),
  customerGroup: z.string().optional()
}).refine((data: any) => data.methodId || data.methodCode, {
  message: 'Either methodId or methodCode must be provided',
  path: ['methodId']
});

const shippingMethodsQuerySchema = z.object({
  pincode: z.string().min(5, 'Valid pincode is required'),
  weight: z.number().optional(),
  orderValue: z.number().optional(),
  productCategories: z.array(z.string()).optional(),
  customerGroup: z.string().optional()
});

interface EtaRequestBody {
  pincode: string;
  methodId?: string;
  methodCode?: string;
  weight?: number;
  orderValue?: number;
  productCategories?: string[];
  customerGroup?: string;
}

interface AvailableMethodsQuery {
  pincode: string;
  weight?: number;
  orderValue?: number;
  productCategories?: string[];
  customerGroup?: string;
}

// Zod schemas for admin shipping method management
const shippingMethodSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  baseRate: z.number().nonnegative(),
  estimatedDays: z.number().int().nonnegative(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  displayOrder: z.number().int().optional(),
});

const shippingMethodUpdateSchema = shippingMethodSchema.partial();

// Zod schemas for admin shipping zone management
const shippingZoneSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  countries: z.array(z.string()),
  regions: z.array(z.object({
    country: z.string(),
    state: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional()
  })).optional(),
  pincodePatterns: z.array(z.string()).optional(),
  pincodeRanges: z.array(z.string()).optional(),
  excludedPincodes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional()
});

const shippingZoneUpdateSchema = shippingZoneSchema.partial();

// Zod schemas for admin shipping rate management
const shippingRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().nonnegative(),
  shippingMethodId: z.string().uuid(),
  shippingZoneId: z.string().uuid(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  minOrderValue: z.number().optional(),
  maxOrderValue: z.number().optional(),
  estimatedDays: z.number().int().optional(),
  conditions: z.object({
    productCategories: z.array(z.string()).optional(),
    customerGroups: z.array(z.string()).optional(),
    weekdays: z.array(z.number().min(0).max(6)).optional(),
    timeRanges: z.array(z.object({
      start: z.string(),
      end: z.string()
    })).optional()
  }).optional(),
  isActive: z.boolean().optional()
});

const shippingRateUpdateSchema = shippingRateSchema.partial();

export class ShippingController {
  private shippingService: ShippingService;
  private shippingMethodRepository: Repository<ShippingMethod>;
  private shippingZoneRepository: Repository<ShippingZone>;
  private shippingRateRepository: Repository<ShippingRate>;

  constructor() {
    this.shippingService = new ShippingService();
    this.shippingMethodRepository = AppDataSource.getRepository(ShippingMethod);
    this.shippingZoneRepository = AppDataSource.getRepository(ShippingZone);
    this.shippingRateRepository = AppDataSource.getRepository(ShippingRate);
  }

  /**
   * Register shipping routes
   * @param fastify - Fastify instance
   */
  async registerRoutes(fastify: FastifyInstance): Promise<void> {
    // List all shipping methods
    fastify.get(
      '/methods',
      {
        schema: {
          tags: ['shipping'],
          summary: 'List shipping methods',
          description: 'Get all available shipping methods',
          response: {
            200: {
              description: 'Successful response',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  baseRate: { type: 'number' },
                  estimatedDays: { type: 'number' },
                  icon: { type: 'string' }
                }
              }
            }
          }
        }
      },
      this.listShippingMethods.bind(this)
    );

    // Get available shipping methods for a location
    fastify.get(
      '/methods/available',
      {
        schema: {
          tags: ['shipping'],
          summary: 'Get available shipping methods',
          description: 'Get available shipping methods for a specific location',
          querystring: {
            type: 'object',
            required: ['pincode'],
            properties: {
              pincode: { type: 'string', description: 'Delivery location pincode' },
              weight: { type: 'number', description: 'Package weight in kg' },
              orderValue: { type: 'number', description: 'Order value for rate calculation' },
              productCategories: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Product categories in the order'
              },
              customerGroup: { type: 'string', description: 'Customer group for special rates' }
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  baseRate: { type: 'number' },
                  estimatedDays: { type: 'number' },
                  icon: { type: 'string' },
                  eta: {
                    type: 'object',
                    properties: {
                      days: { type: 'number' },
                      estimatedDeliveryDate: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        },
        preHandler: validateRequest(shippingMethodsQuerySchema, 'query')
      },
      this.getAvailableShippingMethods.bind(this)
    );

    // Calculate ETA for a specific shipping method and location
    fastify.post(
      '/eta',
      {
        schema: {
          tags: ['shipping'],
          summary: 'Calculate shipping ETA',
          description: 'Calculate estimated time of arrival for a specific shipping method and location',
          body: {
            type: 'object',
            required: ['pincode'],
            properties: {
              pincode: { type: 'string', description: 'Delivery location pincode' },
              methodId: { type: 'string', description: 'Shipping method ID' },
              methodCode: { type: 'string', description: 'Shipping method code (alternative to ID)' },
              weight: { type: 'number', description: 'Package weight in kg' },
              orderValue: { type: 'number', description: 'Order value for rate calculation' },
              productCategories: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Product categories in the order'
              },
              customerGroup: { type: 'string', description: 'Customer group for special rates' }
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                baseRate: { type: 'number' },
                estimatedDays: { type: 'number' },
                eta: {
                  type: 'object',
                  properties: {
                    days: { type: 'number' },
                    estimatedDeliveryDate: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        preHandler: validateRequest(etaCalculationSchema)
      },
      this.calculateETA.bind(this)
    );
  }

  /**
   * Register admin shipping method routes
   * @param fastify - Fastify instance
   */
  async registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
    // Create shipping method
    fastify.post(
      '/admin/shipping-methods',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingMethodSchema, 'body')],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Create shipping method',
          body: zodToJsonSchema(shippingMethodSchema),
          response: { 201: { type: 'object' } }
        }
      },
      this.createShippingMethod.bind(this)
    );
    // Update shipping method
    fastify.put(
      '/admin/shipping-methods/:id',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingMethodUpdateSchema, 'body')],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Update shipping method',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          body: zodToJsonSchema(shippingMethodUpdateSchema),
          response: { 200: { type: 'object' } }
        }
      },
      this.updateShippingMethod.bind(this)
    );
    // Delete shipping method
    fastify.delete(
      '/admin/shipping-methods/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Delete shipping method',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 204: { type: 'null' } }
        }
      },
      this.deleteShippingMethod.bind(this)
    );
    // Get shipping method by ID
    fastify.get(
      '/admin/shipping-methods/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Get shipping method by ID',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 200: { type: 'object' } }
        }
      },
      this.getShippingMethodById.bind(this)
    );

    // Shipping Zone Routes
    fastify.post(
      '/admin/shipping-zones',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingZoneSchema)],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Create shipping zone',
          body: zodToJsonSchema(shippingZoneSchema),
          response: { 201: { type: 'object' } }
        }
      },
      this.createShippingZone.bind(this)
    );

    fastify.put(
      '/admin/shipping-zones/:id',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingZoneUpdateSchema)],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Update shipping zone',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          body: zodToJsonSchema(shippingZoneUpdateSchema),
          response: { 200: { type: 'object' } }
        }
      },
      this.updateShippingZone.bind(this)
    );

    fastify.delete(
      '/admin/shipping-zones/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Delete shipping zone',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 204: { type: 'null' } }
        }
      },
      this.deleteShippingZone.bind(this)
    );

    fastify.get(
      '/admin/shipping-zones',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'List shipping zones',
          response: { 200: { type: 'array' } }
        }
      },
      this.listShippingZones.bind(this)
    );

    fastify.get(
      '/admin/shipping-zones/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Get shipping zone by ID',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 200: { type: 'object' } }
        }
      },
      this.getShippingZoneById.bind(this)
    );

    // Shipping Rate Routes
    fastify.post(
      '/admin/shipping-rates',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingRateSchema)],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Create shipping rate',
          body: zodToJsonSchema(shippingRateSchema),
          response: { 201: { type: 'object' } }
        }
      },
      this.createShippingRate.bind(this)
    );

    fastify.put(
      '/admin/shipping-rates/:id',
      {
        preHandler: [authenticate, authorize(['admin']), validateRequest(shippingRateUpdateSchema)],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Update shipping rate',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          body: zodToJsonSchema(shippingRateUpdateSchema),
          response: { 200: { type: 'object' } }
        }
      },
      this.updateShippingRate.bind(this)
    );

    fastify.delete(
      '/admin/shipping-rates/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Delete shipping rate',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 204: { type: 'null' } }
        }
      },
      this.deleteShippingRate.bind(this)
    );

    fastify.get(
      '/admin/shipping-rates',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'List shipping rates',
          response: { 200: { type: 'array' } }
        }
      },
      this.listShippingRates.bind(this)
    );

    fastify.get(
      '/admin/shipping-rates/:id',
      {
        preHandler: [authenticate, authorize(['admin'])],
        schema: {
          tags: ['admin-shipping'],
          summary: 'Get shipping rate by ID',
          params: zodToJsonSchema(z.object({ id: z.string() })),
          response: { 200: { type: 'object' } }
        }
      },
      this.getShippingRateById.bind(this)
    );
  }

  /**
   * List all shipping methods
   */
  async listShippingMethods(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const methods = await this.shippingService.listShippingMethods();
      return reply.code(200).send(methods);
    } catch (error) {
      logger.error({
        method: 'listShippingMethods',
        error: error instanceof Error ? error.message : String(error)
      });
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to list shipping methods'
      });
    }
  }

  /**
   * Get available shipping methods for a location
   */
  async getAvailableShippingMethods(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { pincode, weight, orderValue, productCategories, customerGroup } = request.query as AvailableMethodsQuery;

      const availableMethods = await this.shippingService.getAvailableShippingMethods(
        pincode,
        { weight, orderValue, productCategories, customerGroup }
      );

      return reply.code(200).send(availableMethods);
    } catch (error) {
      logger.error({
        method: 'getAvailableShippingMethods',
        query: request.query,
        error: error instanceof Error ? error.message : String(error)
      });
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get available shipping methods'
      });
    }
  }

  /**
   * Calculate ETA for a specific shipping method and location
   */
  async calculateETA(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { pincode, methodId, methodCode, weight, orderValue, productCategories, customerGroup } = request.body as EtaRequestBody;

      // If methodId is provided, use it directly
      if (methodId) {
        const result = await this.shippingService.calculateShipping(
          methodId,
          pincode,
          { weight, orderValue, productCategories, customerGroup }
        );
        return reply.code(200).send(result);
      }

      // If methodCode is provided, find the method by code first
      if (methodCode) {
        const method = await this.shippingService.getShippingMethodByCode(methodCode);
        
        if (!method) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Shipping method with code '${methodCode}' not found`
          });
        }
        
        const result = await this.shippingService.calculateShipping(
          method.id,
          pincode,
          { weight, orderValue, productCategories, customerGroup }
        );
        return reply.code(200).send(result);
      }

      // This should never happen due to Zod validation
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Either methodId or methodCode must be provided'
      });
    } catch (error) {
      logger.error({
        method: 'calculateETA',
        body: request.body,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message === 'Shipping method not found or not active') {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Shipping method not found or not active'
          });
        }
        
        if (error.message === 'Shipping not available for this location') {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Shipping not available for this location'
          });
        }
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to calculate shipping ETA'
      });
    }
  }

  /**
   * Find shipping zones applicable for a pincode
   */
  private async findApplicableShippingZones(pincode: string): Promise<ShippingZone[]> {
    // Get all active zones
    const zones = await this.shippingZoneRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' }
    });

    // Filter zones that apply to this pincode
    return zones.filter((zone: ShippingZone) => {
      // Check if pincode is excluded
      if (zone.excludedPincodes && zone.excludedPincodes.includes(pincode)) {
        return false;
      }

      // Check if pincode is directly included
      if (zone.regions) {
        for (const region of zone.regions) {
          if (region.pincode === pincode) {
            return true;
          }
        }
      }

      // Check if pincode matches any pattern
      if (zone.pincodePatterns) {
        for (const pattern of zone.pincodePatterns) {
          if (new RegExp(pattern).test(pincode)) {
            return true;
          }
        }
      }

      // Check if pincode falls within any range
      if (zone.pincodeRanges) {
        for (const range of zone.pincodeRanges) {
          const [start, end] = range.split('-');
          if (pincode >= start && pincode <= end) {
            return true;
          }
        }
      }

      return false;
    });
  }

  /**
   * Find the best shipping rate for a method across multiple zones
   */
  private async findBestRate(
    methodId: string,
    zoneIds: string[],
    weight?: number,
    orderValue?: number,
    productCategories?: string[],
    customerGroup?: string
  ): Promise<ShippingRate | null> {
    // Get all applicable rates
    const rates = await this.shippingRateRepository.find({
      where: {
        shippingMethodId: methodId,
        shippingZoneId: In(zoneIds),
        isActive: true
      }
    });

    // Filter rates based on conditions
    const applicableRates = rates.filter((rate: ShippingRate) => {
      // Check weight constraints
      if (weight !== undefined) {
        if (rate.minWeight !== null && weight < rate.minWeight) return false;
        if (rate.maxWeight !== null && weight > rate.maxWeight) return false;
      }

      // Check order value constraints
      if (orderValue !== undefined) {
        if (rate.minOrderValue !== null && orderValue < rate.minOrderValue) return false;
        if (rate.maxOrderValue !== null && orderValue > rate.maxOrderValue) return false;
      }

      // Check additional conditions
      if (rate.conditions) {
        // Check product categories
        if (rate.conditions.productCategories && productCategories) {
          const hasMatchingCategory = productCategories.some(category => 
            rate.conditions?.productCategories?.includes(category)
          );
          if (!hasMatchingCategory) return false;
        }

        // Check customer group
        if (rate.conditions.customerGroups && customerGroup) {
          if (!rate.conditions.customerGroups.includes(customerGroup)) {
            return false;
          }
        }

        // Check weekday
        if (rate.conditions.weekdays) {
          const currentDay = new Date().getDay();
          if (!rate.conditions.weekdays.includes(currentDay)) {
            return false;
          }
        }

        // Check time ranges
        if (rate.conditions.timeRanges) {
          const now = new Date();
          const currentTime = `${now.getHours()}:${now.getMinutes()}`;
          
          const isInTimeRange = rate.conditions.timeRanges.some((range: { start: string; end: string }) => {
            return currentTime >= range.start && currentTime <= range.end;
          });
          
          if (!isInTimeRange) return false;
        }
      }

      return true;
    });

    // Return the cheapest applicable rate
    return applicableRates.sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate)[0] || null;
  }

  // Admin: Create shipping method
  async createShippingMethod(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const data = request.body;
      const method = this.shippingMethodRepository.create(data);
      const savedMethod = await this.shippingMethodRepository.save(method);
      
      // Ensure we have a single entity, not an array
      const shippingMethod = Array.isArray(savedMethod) ? savedMethod[0] : savedMethod;
      
      // Explicitly select the fields we want to return
      const response = {
        statusCode: 201,
        message: 'Shipping method created successfully',
        data: {
          id: shippingMethod.id,
          name: shippingMethod.name,
          code: shippingMethod.code,
          description: shippingMethod.description,
          baseRate: shippingMethod.baseRate,
          estimatedDays: shippingMethod.estimatedDays,
          icon: shippingMethod.icon,
          isActive: shippingMethod.isActive,
          settings: shippingMethod.settings,
          displayOrder: shippingMethod.displayOrder,
          createdAt: shippingMethod.createdAt,
          updatedAt: shippingMethod.updatedAt
        }
      };
      
      return reply.code(201).send(response);
    } catch (error: any) {
      logger.error({
        method: 'createShippingMethod',
        error: error instanceof Error ? error.message : String(error),
        data: request.body
      });
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'A shipping method with this code already exists'
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create shipping method'
      });
    }
  }

  // Admin: Update shipping method
  async updateShippingMethod(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      const data = request.body;
      const method = await this.shippingMethodRepository.findOne({ where: { id } });
      if (!method) return reply.code(404).send({ error: 'Shipping method not found' });
      Object.assign(method, data);
      await this.shippingMethodRepository.save(method);
      return reply.code(200).send(method);
    } catch (error) {
      logger.error({ method: 'updateShippingMethod', error });
      return reply.code(500).send({ error: 'Failed to update shipping method' });
    }
  }

  // Admin: Delete shipping method
  async deleteShippingMethod(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      const method = await this.shippingMethodRepository.findOne({ where: { id } });
      if (!method) return reply.code(404).send({ error: 'Shipping method not found' });
      await this.shippingMethodRepository.remove(method);
      return reply.code(204).send();
    } catch (error) {
      logger.error({ method: 'deleteShippingMethod', error });
      return reply.code(500).send({ error: 'Failed to delete shipping method' });
    }
  }

  // Admin: Get shipping method by ID
  async getShippingMethodById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      const method = await this.shippingMethodRepository.findOne({ where: { id } });
      if (!method) return reply.code(404).send({ error: 'Shipping method not found' });
      return reply.code(200).send(method);
    } catch (error) {
      logger.error({ method: 'getShippingMethodById', error });
      return reply.code(500).send({ error: 'Failed to get shipping method' });
    }
  }

  // Admin: Create shipping zone
  async createShippingZone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const data = request.body;
      const zone = this.shippingZoneRepository.create(data);
      const savedZone = await this.shippingZoneRepository.save(zone);
      
      return reply.code(201).send({
        statusCode: 201,
        message: 'Shipping zone created successfully',
        data: savedZone
      });
    } catch (error: any) {
      logger.error({
        method: 'createShippingZone',
        error: error instanceof Error ? error.message : String(error),
        data: request.body
      });
      
      if (error.code === '23505') {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'A shipping zone with this code already exists'
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create shipping zone'
      });
    }
  }

  // Admin: Update shipping zone
  async updateShippingZone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      const data = request.body;
      
      const zone = await this.shippingZoneRepository.findOne({ where: { id } });
      if (!zone) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping zone not found'
        });
      }
      
      Object.assign(zone, data);
      const updatedZone = await this.shippingZoneRepository.save(zone);
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping zone updated successfully',
        data: updatedZone
      });
    } catch (error: any) {
      logger.error({
        method: 'updateShippingZone',
        error: error instanceof Error ? error.message : String(error),
        params: request.params,
        data: request.body
      });
      
      if (error.code === '23505') {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'A shipping zone with this code already exists'
        });
      }
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update shipping zone'
      });
    }
  }

  // Admin: Delete shipping zone
  async deleteShippingZone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      
      const zone = await this.shippingZoneRepository.findOne({ 
        where: { id },
        relations: ['rates']
      });
      
      if (!zone) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping zone not found'
        });
      }
      
      // Check if zone has associated rates
      if (zone.rates && zone.rates.length > 0) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Cannot delete shipping zone with associated rates'
        });
      }
      
      await this.shippingZoneRepository.remove(zone);
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({
        method: 'deleteShippingZone',
        error: error instanceof Error ? error.message : String(error),
        params: request.params
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete shipping zone'
      });
    }
  }

  // Admin: List shipping zones
  async listShippingZones(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const zones = await this.shippingZoneRepository.find({
        relations: ['rates', 'methods']
      });
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping zones retrieved successfully',
        data: zones
      });
    } catch (error) {
      logger.error({
        method: 'listShippingZones',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to list shipping zones'
      });
    }
  }

  // Admin: Get shipping zone by ID
  async getShippingZoneById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      
      const zone = await this.shippingZoneRepository.findOne({
        where: { id },
        relations: ['rates', 'methods']
      });
      
      if (!zone) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping zone not found'
        });
      }
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping zone retrieved successfully',
        data: zone
      });
    } catch (error) {
      logger.error({
        method: 'getShippingZoneById',
        error: error instanceof Error ? error.message : String(error),
        params: request.params
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get shipping zone'
      });
    }
  }

  // Admin: Create shipping rate
  async createShippingRate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const data = request.body;
      
      // Verify shipping method exists
      const method = await this.shippingMethodRepository.findOne({
        where: { id: data.shippingMethodId }
      });
      
      if (!method) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping method not found'
        });
      }
      
      // Verify shipping zone exists
      const zone = await this.shippingZoneRepository.findOne({
        where: { id: data.shippingZoneId }
      });
      
      if (!zone) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping zone not found'
        });
      }
      
      const rate = this.shippingRateRepository.create(data);
      const savedRate = await this.shippingRateRepository.save(rate);
      
      return reply.code(201).send({
        statusCode: 201,
        message: 'Shipping rate created successfully',
        data: savedRate
      });
    } catch (error: any) {
      logger.error({
        method: 'createShippingRate',
        error: error instanceof Error ? error.message : String(error),
        data: request.body
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create shipping rate'
      });
    }
  }

  // Admin: Update shipping rate
  async updateShippingRate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      const data = request.body;
      
      const rate = await this.shippingRateRepository.findOne({
        where: { id },
        relations: ['shippingMethod', 'shippingZone']
      });
      
      if (!rate) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping rate not found'
        });
      }
      
      // If shipping method ID is being updated, verify it exists
      if (data.shippingMethodId && data.shippingMethodId !== rate.shippingMethodId) {
        const method = await this.shippingMethodRepository.findOne({
          where: { id: data.shippingMethodId }
        });
        
        if (!method) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Shipping method not found'
          });
        }
      }
      
      // If shipping zone ID is being updated, verify it exists
      if (data.shippingZoneId && data.shippingZoneId !== rate.shippingZoneId) {
        const zone = await this.shippingZoneRepository.findOne({
          where: { id: data.shippingZoneId }
        });
        
        if (!zone) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Shipping zone not found'
          });
        }
      }
      
      Object.assign(rate, data);
      const updatedRate = await this.shippingRateRepository.save(rate);
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping rate updated successfully',
        data: updatedRate
      });
    } catch (error) {
      logger.error({
        method: 'updateShippingRate',
        error: error instanceof Error ? error.message : String(error),
        params: request.params,
        data: request.body
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update shipping rate'
      });
    }
  }

  // Admin: Delete shipping rate
  async deleteShippingRate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      
      const rate = await this.shippingRateRepository.findOne({ where: { id } });
      
      if (!rate) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping rate not found'
        });
      }
      
      await this.shippingRateRepository.remove(rate);
      
      return reply.code(204).send();
    } catch (error) {
      logger.error({
        method: 'deleteShippingRate',
        error: error instanceof Error ? error.message : String(error),
        params: request.params
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete shipping rate'
      });
    }
  }

  // Admin: List shipping rates
  async listShippingRates(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const rates = await this.shippingRateRepository.find({
        relations: ['shippingMethod', 'shippingZone']
      });
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping rates retrieved successfully',
        data: rates
      });
    } catch (error) {
      logger.error({
        method: 'listShippingRates',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to list shipping rates'
      });
    }
  }

  // Admin: Get shipping rate by ID
  async getShippingRateById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params;
      
      const rate = await this.shippingRateRepository.findOne({
        where: { id },
        relations: ['shippingMethod', 'shippingZone']
      });
      
      if (!rate) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Shipping rate not found'
        });
      }
      
      return reply.code(200).send({
        statusCode: 200,
        message: 'Shipping rate retrieved successfully',
        data: rate
      });
    } catch (error) {
      logger.error({
        method: 'getShippingRateById',
        error: error instanceof Error ? error.message : String(error),
        params: request.params
      });
      
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get shipping rate'
      });
    }
  }
} 