import { z } from 'zod'

/**
 * Validates request data against a Zod schema
 * @param data The data to validate
 * @param schema The Zod schema to validate against
 * @returns The validated and typed data
 * @throws ZodError if validation fails
 */
export function validateRequest<T extends z.ZodType>(
  data: unknown,
  schema: T
): z.infer<T> {
  return schema.parse(data)
} 