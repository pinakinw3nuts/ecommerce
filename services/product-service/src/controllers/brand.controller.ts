import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BrandService } from '../services/brand.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import { Brand } from '../entities/Brand';
import { handleBrandImageUpload } from '../utils/fileUpload';

const brandService = new BrandService();

const brandSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.union([
    z.string().url({ message: "Must be a valid URL (include http:// or https://)" }),
    z.literal("")
  ]).optional().transform(val => val === "" ? undefined : val),
  isActive: z.boolean().optional()
});

export const brandController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['brands'],
        summary: 'List all brands',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          skip?: number;
          take?: number;
          isActive?: boolean;
        }
      }>, reply) => {
        const brands = await brandService.listBrands(request.query);
        return reply.send(brands);
      }
    });

    fastify.get('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Get a brand by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const brand = await brandService.getBrandById(request.params.id);
        if (!brand) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
        return reply.send(brand);
      }
    });

    fastify.get('/:id/products', {
      schema: {
        tags: ['brands'],
        summary: 'Get products by brand ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                mediaUrl: { type: 'string' }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Querystring: { skip?: number; take?: number };
      }>, reply) => {
        const products = await brandService.getBrandProducts(request.params.id, request.query);
        return reply.send(products);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    console.log('Registering protected brand routes');
    
    // Upload brand logo image
    fastify.post('/upload-image', {
      schema: {
        tags: ['admin-brands'],
        summary: 'Upload a brand logo image',
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              imageUrl: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const imageUrl = await handleBrandImageUpload(request);
          console.log('Brand logo uploaded successfully:', imageUrl);
          return reply.send({ imageUrl });
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error uploading image',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });
    
    // Admin routes for brands
    fastify.get('/admin/brands', {
      schema: {
        tags: ['brands'],
        summary: 'List all brands (admin)',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            take: { type: 'number' },
            search: { type: 'string' },
            isActive: { type: 'boolean' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          page?: number;
          take?: number;
          search?: string;
          isActive?: boolean;
          sortBy?: string;
          sortOrder?: 'asc' | 'desc';
        }
      }>, reply) => {
        console.log('Admin brands GET /admin/brands handler called', request.query);
        const brands = await brandService.listBrands(request.query);
        return reply.send(brands);
      }
    });
    
    // Get brand by ID (admin)
    fastify.get('/admin/brands/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Get a brand by ID (admin)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        console.log(`Admin brands GET /admin/brands/${request.params.id} handler called`);
        const brand = await brandService.getBrandById(request.params.id);
        if (!brand) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
        return reply.send(brand);
      }
    });

    // Create brand with image upload
    fastify.post('/with-image', {
      schema: {
        tags: ['admin-brands'],
        summary: 'Create a new brand with logo upload',
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          // First handle the image upload
          const logoUrl = await handleBrandImageUpload(request);
          
          // Then get the form fields
          const data = await request.body as any;
          
          // Create the brand with the uploaded logo URL
          const brand = await brandService.createBrand({
            name: data.name,
            description: data.description,
            website: data.website,
            logoUrl
          });
          
          return reply.code(201).send(brand);
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error creating brand with logo',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Create brand (admin)
    fastify.post('/admin/brands', {
      schema: {
        tags: ['brands'],
        summary: 'Create a new brand (admin)',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Body: any }>, reply) => {
        console.log('Admin brands POST /admin/brands handler called', request.body);
        const body = request.body as { 
          name: string;
          description?: string;
          logoUrl?: string;
          website?: string;
        };
        
        const brand = await brandService.createBrand({
          name: body.name,
          description: body.description,
          logoUrl: body.logoUrl,
          website: body.website
        });
        return reply.code(201).send(brand);
      }
    });

    // Update brand with image
    fastify.put('/:id/with-image', {
      schema: {
        tags: ['admin-brands'],
        summary: 'Update a brand with logo upload',
        consumes: ['multipart/form-data'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Params: { id: string };
      }>, reply: FastifyReply) => {
        try {
          // First handle the image upload
          const logoUrl = await handleBrandImageUpload(request);
          
          // Then get the form fields
          const data = await request.body as any;
          
          // Update the brand with the uploaded logo URL
          const brand = await brandService.updateBrand(request.params.id, {
            name: data.name,
            description: data.description,
            website: data.website,
            isActive: data.isActive === 'true', // isActive is supported in updateBrand
            logoUrl
          });
          
          return reply.send(brand);
        } catch (error) {
          request.log.error(error);
          return reply.code(400).send({
            message: 'Error updating brand with logo',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Update brand (admin)
    fastify.put('/admin/brands/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Update a brand (admin)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        console.log(`Admin brands PUT /admin/brands/${(request.params as any).id} preHandler`);
        console.log('Request headers:', request.headers);
        console.log('Request body:', request.body);
        
        if (!request.body || 
            (typeof request.body === 'object' && Object.keys(request.body).length === 0)) {
          console.error('Empty request body received');
          return reply.code(400).send({
            message: 'Request body cannot be empty',
            errors: [{
              field: 'body',
              message: 'Request body is required for update operations'
            }]
          });
        }
        
        return validateRequest(brandSchema.partial())(request, reply);
      },
      handler: async (request: FastifyRequest<{ 
        Params: { id: string }, 
        Body: Partial<z.infer<typeof brandSchema>> 
      }>, reply) => {
        console.log(`Admin brands PUT /admin/brands/${request.params.id} handler called`);
        console.log('Request body in handler:', request.body);
        
        try {
          const brand = await brandService.updateBrand(request.params.id, request.body);
          return reply.send(brand);
        } catch (error) {
          console.error('Error updating brand:', error);
          return reply.code(404).send({ message: 'Brand not found' });
        }
      }
    });
    
    // Delete brand (admin)
    fastify.delete('/admin/brands/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Delete a brand (admin)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          204: { type: 'null' },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        console.log(`Admin brands DELETE /admin/brands/${request.params.id} handler called`);
        const success = await brandService.deleteBrand(request.params.id);
        if (!success) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
        return reply.code(204).send();
      }
    });
    
    // Bulk delete brands (admin)
    fastify.post('/admin/brands/bulk-delete', {
      schema: {
        tags: ['brands'],
        summary: 'Bulk delete brands (admin)',
        body: {
          type: 'object',
          required: ['brandIds'],
          properties: {
            brandIds: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              count: { type: 'number' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ 
        Body: { brandIds: string[] } 
      }>, reply) => {
        console.log('Admin brands POST /admin/brands/bulk-delete handler called', request.body);
        
        const { brandIds } = request.body;
        if (!brandIds || !brandIds.length) {
          return reply.code(400).send({ message: 'No brand IDs provided' });
        }
        
        let count = 0;
        for (const id of brandIds) {
          try {
            await brandService.deleteBrand(id);
            count++;
          } catch (err) {
            console.error(`Failed to delete brand ${id}:`, err);
          }
        }
        
        return reply.send({ 
          message: `Successfully deleted ${count} brands`,
          count
        });
      }
    });
    
    // Bulk update brand status (admin)
    fastify.post('/admin/brands/bulk-status', {
      schema: {
        tags: ['brands'],
        summary: 'Bulk update brand status (admin)',
        body: {
          type: 'object',
          required: ['brandIds', 'isActive'],
          properties: {
            brandIds: { 
              type: 'array',
              items: { type: 'string' }
            },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              count: { type: 'number' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ 
        Body: { 
          brandIds: string[],
          isActive: boolean
        } 
      }>, reply) => {
        console.log('Admin brands POST /admin/brands/bulk-status handler called', request.body);
        
        const { brandIds, isActive } = request.body;
        if (!brandIds || !brandIds.length) {
          return reply.code(400).send({ message: 'No brand IDs provided' });
        }
        
        let count = 0;
        for (const id of brandIds) {
          try {
            await brandService.updateBrand(id, { isActive });
            count++;
          } catch (err) {
            console.error(`Failed to update brand ${id} status:`, err);
          }
        }
        
        return reply.send({ 
          message: `Successfully updated ${count} brands to ${isActive ? 'active' : 'inactive'}`,
          count
        });
      }
    });
    
    // Export brands to CSV (admin)
    fastify.post('/admin/brands/export', {
      schema: {
        tags: ['brands'],
        summary: 'Export brands to CSV (admin)',
        body: {
          type: 'object',
          properties: {
            brandIds: { 
              oneOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'string', enum: ['all'] }
              ]
            }
          }
        },
        response: {
          200: {
            type: 'string',
            format: 'binary'
          }
        }
      },
      handler: async (request: FastifyRequest<{ 
        Body: { 
          brandIds: string[] | 'all'
        } 
      }>, reply) => {
        console.log('Admin brands POST /admin/brands/export handler called', request.body);
        
        const { brandIds } = request.body as { brandIds: string[] | 'all' };
        
        // Get brands based on request
        let brands: Brand[] = [];
        if (brandIds === 'all') {
          brands = await brandService.listBrands();
        } else if (Array.isArray(brandIds) && brandIds.length > 0) {
          brands = [];
          for (const id of brandIds) {
            const brand = await brandService.getBrandById(id);
            if (brand) brands.push(brand);
          }
        } else {
          return reply.code(400).send({ message: 'Invalid brandIds parameter' });
        }
        
        // Generate CSV header
        const csvHeader = 'ID,Name,Description,Logo URL,Website,Is Active,Created At,Updated At\n';
        
        // Generate CSV rows
        const csvRows = brands.map(brand => {
          return [
            brand.id,
            brand.name ? `"${brand.name.replace(/"/g, '""')}"` : '',
            brand.description ? `"${brand.description.replace(/"/g, '""')}"` : '',
            brand.logoUrl || '',
            brand.website || '',
            brand.isActive ? 'Yes' : 'No',
            brand.createdAt ? new Date(brand.createdAt).toISOString() : '',
            brand.updatedAt ? new Date(brand.updatedAt).toISOString() : ''
          ].join(',');
        }).join('\n');
        
        // Combine header and rows
        const csv = csvHeader + csvRows;
        
        // Set headers for file download
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="brands.csv"');
        return reply.send(csv);
      }
    });
    
    fastify.get('/', {
      schema: {
        tags: ['brands'],
        summary: 'List all brands (protected)',
        querystring: {
          type: 'object',
          properties: {
            skip: { type: 'number' },
            take: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{
        Querystring: {
          skip?: number;
          take?: number;
          isActive?: boolean;
        }
      }>, reply) => {
        console.log('Admin brands GET / handler called');
        const brands = await brandService.listBrands(request.query);
        return reply.send(brands);
      }
    });
    
    fastify.get('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Get a brand by ID (protected)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        console.log(`Admin brands GET /${request.params.id} handler called`);
        const brand = await brandService.getBrandById(request.params.id);
        if (!brand) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
        return reply.send(brand);
      }
    });

    fastify.post('/', {
      schema: {
        tags: ['brands'],
        summary: 'Create a new brand',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(brandSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof brandSchema> }>, reply) => {
        console.log('Admin brands POST / handler called');
        const brand = await brandService.createBrand(request.body);
        return reply.code(201).send(brand);
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Update a brand',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            website: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              website: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: validateRequest(brandSchema.partial()),
      handler: async (request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<z.infer<typeof brandSchema>>;
      }>, reply) => {
        console.log(`Admin brands PUT /${request.params.id} handler called`);
        try {
          const brand = await brandService.updateBrand(request.params.id, request.body);
          return reply.send(brand);
        } catch (error) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['brands'],
        summary: 'Delete a brand',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Brand ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Brand deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        console.log(`Admin brands DELETE /${request.params.id} handler called`);
        try {
          await brandService.deleteBrand(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Brand not found' });
        }
      }
    });
  }
}; 