import { z } from 'zod';

/**
 * Schema for the query parameters in the detailed queue metrics endpoint
 */
export const queueMetricsQuerySchema = z.object({
  includeDelayed: z.enum(['true', 'false']).optional().default('true')
    .describe('Whether to include delayed jobs in the metrics'),
  includeFailed: z.enum(['true', 'false']).optional().default('true')
    .describe('Whether to include failed jobs in the metrics')
});

/**
 * Schema for retry failed jobs request
 */
export const retryFailedJobsSchema = z.object({
  queue: z.enum(['email']).describe('Queue to retry failed jobs for')
});

/**
 * Schema for cleaning completed jobs request
 */
export const cleanCompletedJobsSchema = z.object({
  olderThan: z.coerce.number().int().min(0).default(24 * 60 * 60 * 1000) // 24 hours in ms
    .describe('Age in milliseconds. Only jobs older than this will be cleaned'),
  limit: z.coerce.number().int().min(1).max(10000).default(1000)
    .describe('Maximum number of jobs to clean')
}); 