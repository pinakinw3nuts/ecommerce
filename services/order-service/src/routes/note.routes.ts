import { FastifyInstance } from 'fastify';
import { NoteController } from '../controllers/note.controller';
import { roleGuard } from '../middleware/auth.middleware';

const noteResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderId: { type: 'string', format: 'uuid' },
    content: { type: 'string' },
    isPrivate: { type: 'boolean' },
    isInternal: { type: 'boolean' },
    adminId: { type: 'string', format: 'uuid', nullable: true },
    createdBy: { type: 'string', format: 'uuid' },
    updatedBy: { type: 'string', format: 'uuid', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

interface CreateNoteBody {
  content: string;
  isPrivate?: boolean;
}

interface UpdateNoteBody {
  content: string;
  isPrivate?: boolean;
}

interface RequestParams {
  orderId: string;
  noteId?: string;
}

export async function noteRoutes(fastify: FastifyInstance) {
  const noteController = new NoteController();

  // Authenticate all routes in this plugin
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  // Get notes for an order
  fastify.get<{
    Params: RequestParams;
  }>(
    '/:orderId/notes',
    {
      schema: {
        tags: ['Notes'],
        summary: 'Get order notes',
        description: 'Retrieve all notes for a specific order.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: noteResponseSchema
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return noteController.getNotes(request, reply);
    }
  );

  // Add a note to an order (admin only)
  fastify.post<{
    Body: CreateNoteBody;
    Params: RequestParams;
  }>(
    '/:orderId/notes',
    {
      schema: {
        tags: ['Notes'],
        summary: 'Add order note',
        description: 'Add a new note to a specific order. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' },
            isPrivate: { type: 'boolean' }
          }
        },
        response: {
          201: noteResponseSchema,
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
      preHandler: roleGuard(['admin'])
    },
    async (request, reply) => {
      return noteController.addNote(request, reply);
    }
  );

  // Update a note (admin only)
  fastify.put<{
    Body: UpdateNoteBody;
    Params: RequestParams;
  }>(
    '/:orderId/notes/:noteId',
    {
      schema: {
        tags: ['Notes'],
        summary: 'Update order note',
        description: 'Update an existing note. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId', 'noteId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
            noteId: { type: 'string', format: 'uuid' }
          }
        },
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' },
            isPrivate: { type: 'boolean' }
          }
        },
        response: {
          200: noteResponseSchema,
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
      preHandler: roleGuard(['admin'])
    },
    async (request, reply) => {
      return noteController.updateNote(request, reply);
    }
  );

  // Delete a note (admin only)
  fastify.delete<{
    Params: RequestParams;
  }>(
    '/:orderId/notes/:noteId',
    {
      schema: {
        tags: ['Notes'],
        summary: 'Delete order note',
        description: 'Delete an existing note. Admin access required.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId', 'noteId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
            noteId: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          204: {
            type: 'null',
            description: 'Note successfully deleted'
          },
          401: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
      preHandler: roleGuard(['admin'])
    },
    async (request, reply) => {
      return noteController.deleteNote(request, reply);
    }
  );
} 