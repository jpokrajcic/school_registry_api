import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters'),
    roleId: z.coerce
      .number({ message: 'Role ID must be a number' })
      .int('Role ID must be an integer')
      .positive('Role ID must be positive'),
    schoolId: z
      .number({ message: 'School ID must be a number' })
      .int('School ID must be an integer')
      .positive('Region ID must be positive')
      .optional(),
  })
  .strict();

export const SafeUserSchema = z
  .object({
    id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
      message: 'Id must be a positive integer',
    }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters'),
    roleId: z.coerce
      .number({ message: 'Role ID must be a number' })
      .int('Role ID must be an integer')
      .positive('Role ID must be positive'),
    schoolId: z
      .number({ message: 'School ID must be a number' })
      .int('School ID must be an integer')
      .positive('Region ID must be positive')
      .nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const userUpdateSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters'),
    roleId: z.coerce
      .number({ message: 'Role ID must be a number' })
      .int('Role ID must be an integer')
      .positive('Role ID must be positive'),
    schoolId: z
      .number({ message: 'School ID must be a number' })
      .int('School ID must be an integer')
      .positive('Region ID must be positive')
      .optional(),
  })
  .strict();

export const userParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
      message: 'Id must be a positive integer',
    }),
  })
  .strict();

export const userQuerySchema = z
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
    roleId: z.coerce
      .number({ message: 'Role ID must be a number' })
      .int('Role ID must be an integer')
      .positive('Role ID must be positive')
      .optional(),
    schoolId: z.coerce
      .number({ message: 'School ID must be a number' })
      .int('School ID must be an integer')
      .positive('School ID must be positive')
      .optional(),
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

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof userUpdateSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type SafeUserOutput = z.infer<typeof SafeUserSchema>;
