import { z } from 'zod';
import { CarrierRateService } from '../services/CarrierRateService';
import { validateRequest } from '../middlewares/validateRequest';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { CarrierAddress, PackageDetails } from '../carriers/ICarrierService';

// Validation schemas
const rateRequestSchema = z.object({
  destination: z.object({
    name: z.string().min(1, 'Name is required'),
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().length(2, 'Country code must be 2 characters'),
    postalCode: z.string().min(3, 'Valid postal code is required'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    isResidential: z.boolean().optional().default(true)
  }),
  packages: z.array(z.object({
    weight: z.object({
      value: z.number().positive('Weight must be positive'),
      unit: z.enum(['kg', 'lb', 'oz'])
    }),
    dimensions: z.object({
      length: z.number().positive('Length must be positive'),
      width: z.number().positive('Width must be positive'),
      height: z.number().positive('Height must be positive'),
      unit: z.enum(['cm', 'in'])
    }).optional(),
    declaredValue: z.number().optional(),
    description: z.string().optional(),
    requiresSignature: z.boolean().optional(),
    isInsured: z.boolean().optional(),
    insuranceAmount: z.number().optional()
  })).min(1, 'At least one package is required'),
  origin: z.object({
    name: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().length(2, 'Country code must be 2 characters').optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    isResidential: z.boolean().optional().default(false)
  }).optional(),
  shipDate: z.string().datetime().optional(),
  carrierIds: z.array(z.string()).optional(),
  criteria: z.enum(['price', 'time', 'value']).optional()
});

const trackingRequestSchema = z.object({
  trackingNumber: z.string().min(5, 'Valid tracking number is required')
});

// Define request body types
type RateRequestBody = z.infer<typeof rateRequestSchema>;
type TrackingRequestBody = z.infer<typeof trackingRequestSchema>;

/**
 * Controller for carrier rate comparison
 */
export class CarrierRateController {
  private carrierRateService: CarrierRateService;
  
  /**
   * Constructor
   */
  constructor() {
    this.carrierRateService = new CarrierRateService();
  }
  
  /**
   * Register routes
   * @param fastify Fastify instance
   */
  async registerRoutes(fastify: any): Promise<void> {
    // Get rates from all carriers
    fastify.register(async (instance: any) => {
      instance.post('/rates', {
        schema: {
          tags: ['carrier-rates'],
          summary: 'Get shipping rates from all carriers',
          description: 'Get shipping rates from all configured carriers based on shipment details',
          body: {
            type: 'object',
            required: ['destination', 'packages'],
            properties: {
              destination: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  addressLine1: { type: 'string' },
                  addressLine2: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  postalCode: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  isResidential: { type: 'boolean' }
                }
              },
              packages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    weight: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string', enum: ['kg', 'lb', 'oz'] }
                      }
                    },
                    dimensions: {
                      type: 'object',
                      properties: {
                        length: { type: 'number' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                        unit: { type: 'string', enum: ['cm', 'in'] }
                      }
                    },
                    declaredValue: { type: 'number' }
                  }
                }
              },
              origin: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  addressLine1: { type: 'string' },
                  addressLine2: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  postalCode: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  isResidential: { type: 'boolean' }
                }
              },
              shipDate: { type: 'string', format: 'date-time' },
              carrierIds: { 
                type: 'array',
                items: { type: 'string' }
              },
              criteria: { 
                type: 'string',
                enum: ['price', 'time', 'value']
              }
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'object',
              properties: {
                rates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      carrierId: { type: 'string' },
                      carrierName: { type: 'string' },
                      serviceType: { type: 'string' },
                      serviceCode: { type: 'string' },
                      serviceName: { type: 'string' },
                      totalAmount: { type: 'number' },
                      currency: { type: 'string' },
                      estimatedDays: { type: 'number' },
                      estimatedDeliveryDate: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                errors: {
                  type: 'object',
                  additionalProperties: { type: 'string' }
                }
              }
            }
          }
        },
        preHandler: validateRequest(rateRequestSchema),
        handler: this.getRates.bind(this)
      });
      
      // Get best rate
      instance.post('/rates/best', {
        schema: {
          tags: ['carrier-rates'],
          summary: 'Get best shipping rate',
          description: 'Get the best shipping rate based on criteria (price, time, or value)',
          body: {
            type: 'object',
            required: ['destination', 'packages'],
            properties: {
              // Same as /rates endpoint
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'object',
              properties: {
                rate: {
                  type: 'object',
                  properties: {
                    carrierId: { type: 'string' },
                    carrierName: { type: 'string' },
                    serviceType: { type: 'string' },
                    serviceCode: { type: 'string' },
                    serviceName: { type: 'string' },
                    totalAmount: { type: 'number' },
                    currency: { type: 'string' },
                    estimatedDays: { type: 'number' },
                    estimatedDeliveryDate: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        preHandler: validateRequest(rateRequestSchema),
        handler: this.getBestRate.bind(this)
      });
      
      // Track shipment
      instance.post('/track', {
        schema: {
          tags: ['carrier-rates'],
          summary: 'Track shipment',
          description: 'Track shipment across multiple carriers',
          body: {
            type: 'object',
            required: ['trackingNumber'],
            properties: {
              trackingNumber: { type: 'string' }
            }
          },
          response: {
            200: {
              description: 'Successful response',
              type: 'object',
              properties: {
                tracking: {
                  type: 'object',
                  properties: {
                    trackingNumber: { type: 'string' },
                    carrierId: { type: 'string' },
                    carrierName: { type: 'string' },
                    status: { type: 'string' },
                    estimatedDeliveryDate: { type: 'string', format: 'date-time' },
                    actualDeliveryDate: { type: 'string', format: 'date-time' },
                    events: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string', format: 'date-time' },
                          status: { type: 'string' },
                          description: { type: 'string' },
                          location: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        preHandler: validateRequest(trackingRequestSchema),
        handler: this.trackShipment.bind(this)
      });
      
      // Get available carriers
      instance.get('/carriers', {
        schema: {
          tags: ['carrier-rates'],
          summary: 'Get available carriers',
          description: 'Get list of available shipping carriers',
          response: {
            200: {
              description: 'Successful response',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        handler: this.getCarriers.bind(this)
      });
    }, { prefix: '' });
  }
  
  /**
   * Get shipping rates from carriers
   * @param request Fastify request
   * @param reply Fastify reply
   */
  async getRates(request: any, reply: any): Promise<void> {
    try {
      const body = request.body as RateRequestBody;
      
      // Prepare rate request
      const rateRequest = this.prepareRateRequest(body);
      
      // Get rates from carriers
      const result = body.carrierIds && body.carrierIds.length > 0
        ? await this.carrierRateService.getCarrierRates(rateRequest, body.carrierIds)
        : await this.carrierRateService.getAllCarrierRates(rateRequest);
      
      reply.send(result);
    } catch (error) {
      logger.error('Error getting carrier rates', error);
      reply.status(500).send({
        error: 'Failed to get carrier rates',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get best shipping rate
   * @param request Fastify request
   * @param reply Fastify reply
   */
  async getBestRate(request: any, reply: any): Promise<void> {
    try {
      const body = request.body as RateRequestBody;
      
      // Prepare rate request
      const rateRequest = this.prepareRateRequest(body);
      
      // Get best rate
      const criteria = body.criteria || env.DEFAULT_RATE_CRITERIA;
      const rate = await this.carrierRateService.getBestRate(rateRequest, criteria);
      
      if (!rate) {
        reply.status(404).send({
          error: 'No rates found',
          message: 'No shipping rates available for the provided details'
        });
        return;
      }
      
      reply.send({ rate });
    } catch (error) {
      logger.error('Error getting best carrier rate', error);
      reply.status(500).send({
        error: 'Failed to get best carrier rate',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Track shipment
   * @param request Fastify request
   * @param reply Fastify reply
   */
  async trackShipment(request: any, reply: any): Promise<void> {
    try {
      const { trackingNumber } = request.body as TrackingRequestBody;
      
      // Track shipment
      const tracking = await this.carrierRateService.trackShipment(trackingNumber);
      
      if (!tracking) {
        reply.status(404).send({
          error: 'Tracking information not found',
          message: 'Could not find tracking information for the provided tracking number'
        });
        return;
      }
      
      reply.send({ tracking });
    } catch (error) {
      logger.error('Error tracking shipment', error);
      reply.status(500).send({
        error: 'Failed to track shipment',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get available carriers
   * @param request Fastify request
   * @param reply Fastify reply
   */
  async getCarriers(request: any, reply: any): Promise<void> {
    try {
      const carriers = this.carrierRateService.getCarrierOptions();
      reply.send(carriers);
    } catch (error) {
      logger.error('Error getting carriers', error);
      reply.status(500).send({
        error: 'Failed to get carriers',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Prepare rate request from API request body
   * @param body Request body
   */
  private prepareRateRequest(body: RateRequestBody): {
    originAddress: CarrierAddress;
    destinationAddress: CarrierAddress;
    packages: PackageDetails[];
    shipDate?: Date;
  } {
    // Use default origin if not provided
    const origin = body.origin || {
      name: env.DEFAULT_ORIGIN_NAME,
      addressLine1: env.DEFAULT_ORIGIN_ADDRESS_LINE1,
      city: env.DEFAULT_ORIGIN_CITY,
      state: env.DEFAULT_ORIGIN_STATE,
      postalCode: env.DEFAULT_ORIGIN_POSTAL_CODE,
      country: env.DEFAULT_ORIGIN_COUNTRY,
      phone: env.DEFAULT_ORIGIN_PHONE,
      isResidential: false
    };
    
    // Parse ship date if provided
    const shipDate = body.shipDate ? new Date(body.shipDate) : undefined;
    
    return {
      originAddress: {
        name: origin.name || '',
        addressLine1: origin.addressLine1 || '',
        addressLine2: origin.addressLine2,
        city: origin.city || '',
        state: origin.state || '',
        country: origin.country || 'US',
        postalCode: origin.postalCode || '',
        phone: origin.phone,
        email: origin.email,
        isResidential: origin.isResidential
      },
      destinationAddress: {
        name: body.destination.name,
        addressLine1: body.destination.addressLine1,
        addressLine2: body.destination.addressLine2,
        city: body.destination.city,
        state: body.destination.state,
        country: body.destination.country,
        postalCode: body.destination.postalCode,
        phone: body.destination.phone,
        email: body.destination.email,
        isResidential: body.destination.isResidential
      },
      packages: body.packages,
      shipDate
    };
  }
} 