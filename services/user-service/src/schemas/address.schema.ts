import { z } from 'zod';
import { AddressType } from '../entities/address.entity';

export const createAddressSchema = z.object({
  body: z.object({
    street: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    apartment: z.string().max(100).optional(),
    type: z.nativeEnum(AddressType).optional(),
    isDefault: z.boolean().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    instructions: z.string().max(100).optional()
  })
});

export const updateAddressSchema = createAddressSchema.deepPartial(); 