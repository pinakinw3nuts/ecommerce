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
} 