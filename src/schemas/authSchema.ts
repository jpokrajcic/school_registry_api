// regionSchema.ts
import { z } from 'zod';
import type { createRegionSchema } from './regionSchema';

export const loginSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .min(1, 'Email is required')
      .max(255, 'Email must not exceed 255 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict();

export const generateAuthTokensSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .strict();

export const updateRegionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must not exceed 100 characters'),
    isCity: z.boolean(),
  })
  .strict();

export const regionParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
      message: 'Id must be a positive integer',
    }),
  })
  .strict();

export const regionQuerySchema = z
  .object({
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
    isCity: z
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
  })
  .strict();

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
export type RegionParams = z.infer<typeof regionParamsSchema>;
export type RegionQuery = z.infer<typeof regionQuerySchema>;
