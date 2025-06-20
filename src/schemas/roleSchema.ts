import { z } from 'zod';

export const createRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Role name must be at least 3 characters')
      .max(50, 'Role name must not exceed 50 characters'),
    description: z
      .string()
      .trim()
      .max(255, 'Description must not exceed 255 characters')
      .optional(),
  })
  .strict();

export const roleUpdateSchema = z
  .object({
    id: z
      .number({ message: 'School ID must be a number' })
      .int()
      .positive('Id must be positive'),
    name: z
      .string()
      .trim()
      .min(3, 'Role name must be at least 3 characters')
      .max(50, 'Role name must not exceed 50 characters'),
    description: z
      .string()
      .trim()
      .max(255, 'Description must not exceed 255 characters')
      .optional(),
  })
  .strict();

export const roleParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
      message: 'Id must be a positive integer',
    }),
  })
  .strict();

export const roleQuerySchema = z
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

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof roleUpdateSchema>;
export type RoleParams = z.infer<typeof roleParamsSchema>;
export type RoleQuery = z.infer<typeof roleQuerySchema>;
