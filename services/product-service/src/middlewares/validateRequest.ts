import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const data = source === 'body' ? request.body : request.query;
    
    // Special handling for page and limit parameters
    if (source === 'query' && typeof data === 'object' && data !== null) {
      // Type assertion for data object
      const queryData = data as Record<string, any>;
      
      // Log the original data types
      console.log('Original query parameters:', {
        page: queryData.page !== undefined ? { value: queryData.page, type: typeof queryData.page } : 'undefined',
        limit: queryData.limit !== undefined ? { value: queryData.limit, type: typeof queryData.limit } : 'undefined'
      });
      
      // Force page and limit to be strings if they exist
      if (queryData.page !== undefined) {
        queryData.page = String(queryData.page);
      }
      if (queryData.limit !== undefined) {
        queryData.limit = String(queryData.limit);
      }
      
      // Log the modified data types
      console.log('Modified query parameters:', {
        page: queryData.page !== undefined ? { value: queryData.page, type: typeof queryData.page } : 'undefined',
        limit: queryData.limit !== undefined ? { value: queryData.limit, type: typeof queryData.limit } : 'undefined'
      });
    }
    
    const result = schema.safeParse(data);
    if (!result.success) {
      return reply.status(400).send({
        message: 'Validation failed',
        errors: result.error.flatten(),
      });
    }
    // Optionally, assign parsed data back to request
    if (source === 'body') request.body = result.data;
    else request.query = result.data;
  };
} 