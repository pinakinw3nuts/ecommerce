import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AttributeService } from '../services/attribute.service';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';

const attributeService = new AttributeService();

const attributeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['select', 'multiple', 'text', 'number', 'boolean']),
  isFilterable: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().optional(),
  values: z.array(z.object({
    value: z.string(),
    displayValue: z.string().optional(),
    metadata: z.object({
      hexColor: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional()
    }).optional()
  })).optional()
});

const attributeValueSchema = z.object({
  value: z.string(),
  displayValue: z.string().optional(),
  metadata: z.object({
    hexColor: z.string().optional(),
    imageUrl: z.string().optional(),
    sortOrder: z.number().optional()
  }).optional()
});

export const attributeController = {
  registerPublicRoutes: async (fastify: FastifyInstance) => {
    fastify.get('/', {
      schema: {
        tags: ['attributes'],
        summary: 'List all attributes',
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
              required: ['id', 'name', 'type'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                type: { 
                  type: 'string',
                  enum: ['select', 'multiple', 'text', 'number', 'boolean']
                },
                isFilterable: { type: 'boolean', default: true },
                isRequired: { type: 'boolean', default: false },
                sortOrder: { type: 'integer', default: 0 },
                isActive: { type: 'boolean', default: true },
                values: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'value'],
                    properties: {
                      id: { type: 'string' },
                      value: { type: 'string' },
                      displayValue: { type: 'string' },
                      metadata: {
                        type: 'object',
                        properties: {
                          hexColor: { type: 'string' },
                          imageUrl: { type: 'string' },
                          sortOrder: { type: 'integer' }
                        }
                      },
                      isActive: { type: 'boolean', default: true },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      handler: async (request: FastifyRequest<{ Querystring: { skip?: number; take?: number; isActive?: boolean } }>, reply) => {
        const attributes = await attributeService.listAttributes(request.query);
        return reply.send(attributes);
      }
    });

    fastify.get('/:id', {
      schema: {
        tags: ['attributes'],
        summary: 'Get an attribute by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute ID' }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['id', 'name', 'type'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['select', 'multiple', 'text', 'number', 'boolean']
              },
              isFilterable: { type: 'boolean', default: true },
              isRequired: { type: 'boolean', default: false },
              sortOrder: { type: 'integer', default: 0 },
              isActive: { type: 'boolean', default: true },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'value'],
                  properties: {
                    id: { type: 'string' },
                    value: { type: 'string' },
                    displayValue: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        hexColor: { type: 'string' },
                        imageUrl: { type: 'string' },
                        sortOrder: { type: 'integer' }
                      }
                    },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
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
        const attribute = await attributeService.getAttributeById(request.params.id);
        if (!attribute) {
          return reply.code(404).send({ message: 'Attribute not found' });
        }
        return reply.send(attribute);
      }
    });
  },

  registerProtectedRoutes: async (fastify: FastifyInstance) => {
    fastify.post('/', {
      schema: {
        tags: ['attributes'],
        summary: 'Create a new attribute',
        body: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['select', 'multiple', 'text', 'number', 'boolean'] },
            isFilterable: { type: 'boolean' },
            isRequired: { type: 'boolean' },
            sortOrder: { type: 'number' },
            values: {
              type: 'array',
              items: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: { type: 'string' },
                  displayValue: { type: 'string' },
                  metadata: {
                    type: 'object',
                    properties: {
                      hexColor: { type: 'string' },
                      imageUrl: { type: 'string' },
                      sortOrder: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        response: {
          201: {
            type: 'object',
            required: ['id', 'name', 'type'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['select', 'multiple', 'text', 'number', 'boolean']
              },
              isFilterable: { type: 'boolean', default: true },
              isRequired: { type: 'boolean', default: false },
              sortOrder: { type: 'integer', default: 0 },
              isActive: { type: 'boolean', default: true },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'value'],
                  properties: {
                    id: { type: 'string' },
                    value: { type: 'string' },
                    displayValue: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        hexColor: { type: 'string' },
                        imageUrl: { type: 'string' },
                        sortOrder: { type: 'integer' }
                      }
                    },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(attributeSchema),
      handler: async (request: FastifyRequest<{ Body: z.infer<typeof attributeSchema> }>, reply) => {
        const attribute = await attributeService.createAttribute(request.body);
        return reply.code(201).send(attribute);
      }
    });

    fastify.put('/:id', {
      schema: {
        tags: ['attributes'],
        summary: 'Update an attribute',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['select', 'multiple', 'text', 'number', 'boolean'] },
            isFilterable: { type: 'boolean' },
            isRequired: { type: 'boolean' },
            sortOrder: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['id', 'name', 'type'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['select', 'multiple', 'text', 'number', 'boolean']
              },
              isFilterable: { type: 'boolean', default: true },
              isRequired: { type: 'boolean', default: false },
              sortOrder: { type: 'integer', default: 0 },
              isActive: { type: 'boolean', default: true },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'value'],
                  properties: {
                    id: { type: 'string' },
                    value: { type: 'string' },
                    displayValue: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        hexColor: { type: 'string' },
                        imageUrl: { type: 'string' },
                        sortOrder: { type: 'integer' }
                      }
                    },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
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
      preHandler: validateRequest(attributeSchema.partial()),
      handler: async (request: FastifyRequest<{ Params: { id: string }, Body: Partial<z.infer<typeof attributeSchema>> }>, reply) => {
        try {
          const attribute = await attributeService.updateAttribute(request.params.id, request.body);
          return reply.send(attribute);
        } catch (error) {
          return reply.code(404).send({ message: 'Attribute not found' });
        }
      }
    });

    fastify.delete('/:id', {
      schema: {
        tags: ['attributes'],
        summary: 'Delete an attribute',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Attribute deleted successfully'
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
        try {
          await attributeService.deleteAttribute(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Attribute not found' });
        }
      }
    });

    // Attribute Value Routes
    fastify.post('/:id/values', {
      schema: {
        tags: ['attributes'],
        summary: 'Add a value to an attribute',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute ID' }
          }
        },
        body: {
          type: 'object',
          required: ['value'],
          properties: {
            value: { type: 'string' },
            displayValue: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                hexColor: { type: 'string' },
                imageUrl: { type: 'string' },
                sortOrder: { type: 'number' }
              }
            }
          }
        },
        response: {
          201: {
            type: 'object',
            required: ['id', 'value'],
            properties: {
              id: { type: 'string' },
              value: { type: 'string' },
              displayValue: { type: 'string' },
              metadata: {
                type: 'object',
                properties: {
                  hexColor: { type: 'string' },
                  imageUrl: { type: 'string' },
                  sortOrder: { type: 'integer' }
                }
              },
              isActive: { type: 'boolean', default: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      preHandler: validateRequest(attributeValueSchema),
      handler: async (request: FastifyRequest<{ Params: { id: string }, Body: z.infer<typeof attributeValueSchema> }>, reply) => {
        try {
          const value = await attributeService.addAttributeValue(request.params.id, request.body);
          return reply.code(201).send(value);
        } catch (error) {
          return reply.code(404).send({ message: 'Attribute not found' });
        }
      }
    });

    fastify.put('/values/:id', {
      schema: {
        tags: ['attributes'],
        summary: 'Update an attribute value',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute Value ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            displayValue: { type: 'string' },
            metadata: {
              type: 'object',
              properties: {
                hexColor: { type: 'string' },
                imageUrl: { type: 'string' },
                sortOrder: { type: 'number' }
              }
            },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['id', 'value'],
            properties: {
              id: { type: 'string' },
              value: { type: 'string' },
              displayValue: { type: 'string' },
              metadata: {
                type: 'object',
                properties: {
                  hexColor: { type: 'string' },
                  imageUrl: { type: 'string' },
                  sortOrder: { type: 'integer' }
                }
              },
              isActive: { type: 'boolean', default: true },
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
      preHandler: validateRequest(attributeValueSchema.partial()),
      handler: async (request: FastifyRequest<{ Params: { id: string }, Body: Partial<z.infer<typeof attributeValueSchema>> }>, reply) => {
        try {
          const value = await attributeService.updateAttributeValue(request.params.id, request.body);
          return reply.send(value);
        } catch (error) {
          return reply.code(404).send({ message: 'Attribute value not found' });
        }
      }
    });

    fastify.delete('/values/:id', {
      schema: {
        tags: ['attributes'],
        summary: 'Delete an attribute value',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute Value ID' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Attribute value deleted successfully'
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
        try {
          await attributeService.deleteAttributeValue(request.params.id);
          return reply.code(204).send();
        } catch (error) {
          return reply.code(404).send({ message: 'Attribute value not found' });
        }
      }
    });

    // Product Attribute Assignment
    fastify.post('/products/:productId/attributes', {
      schema: {
        tags: ['attributes'],
        summary: 'Assign attributes to a product',
        params: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', description: 'Product ID' }
          }
        },
        body: {
          type: 'object',
          required: ['attributeValues'],
          properties: {
            attributeValues: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['id', 'name', 'slug', 'description', 'price'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              mediaUrl: { type: 'string' },
              isFeatured: { type: 'boolean', default: false },
              isPublished: { type: 'boolean', default: true },
              salePrice: { type: 'number' },
              saleStartDate: { type: 'string', format: 'date-time' },
              saleEndDate: { type: 'string', format: 'date-time' },
              stockQuantity: { type: 'integer', default: 0 },
              isInStock: { type: 'boolean', default: true },
              specifications: { type: 'string' },
              keywords: { 
                type: 'array',
                items: { type: 'string' }
              },
              rating: { type: 'number', default: 0 },
              reviewCount: { type: 'integer', default: 0 },
              seoMetadata: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  ogImage: { type: 'string' }
                }
              },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'value'],
                  properties: {
                    id: { type: 'string' },
                    value: { type: 'string' },
                    displayValue: { type: 'string' },
                    metadata: {
                      type: 'object',
                      properties: {
                        hexColor: { type: 'string' },
                        imageUrl: { type: 'string' },
                        sortOrder: { type: 'integer' }
                      }
                    },
                    isActive: { type: 'boolean', default: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
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
      handler: async (request: FastifyRequest<{
        Params: { productId: string },
        Body: { attributeValues: string[] }
      }>, reply) => {
        try {
          const product = await attributeService.assignAttributesToProduct(
            request.params.productId,
            request.body.attributeValues
          );
          return reply.send(product);
        } catch (error) {
          return reply.code(404).send({ message: 'Product not found' });
        }
      }
    });

    // Add a dedicated endpoint for updating attribute status
    fastify.post('/:id/status', {
      schema: {
        tags: ['attributes'],
        summary: 'Update attribute status',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Attribute ID' }
          }
        },
        body: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean', description: 'New status value' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              isActive: { type: 'boolean' },
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
      handler: async (request: FastifyRequest<{ 
        Params: { id: string }, 
        Body: { isActive: boolean } 
      }>, reply) => {
        try {
          console.log(`Updating attribute ${request.params.id} status to: ${request.body.isActive}`);
          
          const attribute = await attributeService.updateAttribute(request.params.id, { 
            isActive: request.body.isActive 
          });
          
          console.log(`Status update result:`, {
            id: attribute.id,
            name: attribute.name,
            isActive: attribute.isActive
          });
          
          return reply.send(attribute);
        } catch (error) {
          console.error(`Error updating attribute status:`, error);
          return reply.code(404).send({ message: 'Attribute not found' });
        }
      }
    });
  }
}; 