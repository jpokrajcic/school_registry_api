// regionSchema.ts
import { z } from 'zod';

export const createRegionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  is_city: z.boolean().optional().default(true),
});

export const updateRegionSchema = z.object({
  id: z
    .number({ message: 'Id must be a number' })
    .int()
    .positive('Id must be positive'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  is_city: z.boolean(),
});

export const regionParamsSchema = z.object({
  id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
    message: 'Id must be a positive integer',
  }),
});

export const regionQuerySchema = z.object({
  page: z.coerce
    .number({ message: 'Page must be a number' })
    .int()
    .positive({ message: 'Page must be a positive integer' })
    .optional()
    .default(1),
  limit: z.coerce
    .number({ message: 'Page limit must be a number' })
    .int()
    .positive({ message: 'Page limit must be a positive integer' })
    .optional()
    .default(10),
  is_city: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  search: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val.trim() === '') return undefined;
      return val.trim();
    })
    .refine(
      val => {
        if (val === undefined) return true;
        return val.length >= 2 && val.length <= 50;
      },
      {
        message: 'Search term must be between 2 and 50 characters',
      }
    ),
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
export type RegionParams = z.infer<typeof regionParamsSchema>;
export type RegionQuery = z.infer<typeof regionQuerySchema>;
