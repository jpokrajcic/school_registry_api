import { z } from 'zod';

export const createSubjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Subject name must be at least 2 characters')
      .max(100, 'Subject name must not exceed 100 characters'),
    code: z
      .string()
      .trim()
      .min(2, 'Subject code must be at least 2 characters')
      .max(20, 'Subject code must not exceed 20 characters')
      .toUpperCase(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .default(''),
  })
  .strict();

export const subjectUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Subject name must be at least 2 characters')
      .max(100, 'Subject name must not exceed 100 characters'),
    code: z
      .string()
      .trim()
      .min(2, 'Subject code must be at least 2 characters')
      .max(20, 'Subject code must not exceed 20 characters')
      .toUpperCase(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .default(''),
  })
  .strict();

export const subjectParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'Id must be a number' }).int().positive({
      message: 'Id must be a positive integer',
    }),
  })
  .strict();

export const subjectQuerySchema = z
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
          return val.length >= 2 && val.length <= 100;
        },
        {
          message: 'Search term must be between 2 and 100 characters',
        }
      ),
    code: z
      .string()
      .optional()
      .transform(val => {
        if (!val || val.trim() === '') return undefined;
        return val.trim().toUpperCase();
      })
      .refine(
        val => {
          if (val === undefined) return true;
          return val.length >= 2 && val.length <= 20;
        },
        {
          message: 'Subject code must be between 2 and 20 characters',
        }
      ),
  })
  .strict();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof subjectUpdateSchema>;
export type SubjectParams = z.infer<typeof subjectParamsSchema>;
export type SubjectQuery = z.infer<typeof subjectQuerySchema>;
