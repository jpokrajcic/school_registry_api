// regionSchema.ts
import { z } from 'zod';

export const createRegionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  is_city: z.boolean().optional().default(true),
});

export const updateRegionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  is_city: z.boolean().optional(), // no default here!
});

export const regionParamsSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('Invalid region ID');
    return num;
  }),
});

export const regionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
  is_city: z
    .string()
    .optional()
    .transform(val => val === 'true'),
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
export type RegionParams = z.infer<typeof regionParamsSchema>;
export type RegionQuery = z.infer<typeof regionQuerySchema>;
