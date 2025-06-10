// schoolSchema.ts
import { z } from 'zod';
import { OwnershipType } from '../types/database';

export const createSchoolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'New school name must be at least 2 characters')
    .max(100, 'New school name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-'.,&()]+$/,
      'New school name contains invalid characters'
    ),

  address: z
    .string()
    .trim()
    .min(10, 'New school address must be at least 10 characters')
    .max(200, 'New school address must not exceed 200 characters'),

  region_id: z
    .number()
    .int('New schools region ID must be an integer')
    .positive('School region ID must be positive'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid school email address')
    .max(100, 'School email must not exceed 100 characters'),

  phone: z
    .string()
    .trim()
    .regex(
      /^[\+]?[1-9][\d]{0,15}$/,
      'School phone number must be valid (10-16 digits, optional + prefix)'
    )
    .transform(phone => phone.replace(/\D/g, '')), // Remove non-digits

  ownership_type: z.nativeEnum(OwnershipType, {
    errorMap: () => ({
      message: 'School ownership type must be either public or private',
    }),
  }),
});

export const schoolUpdateSchema = z.object({
  id: z
    .number({ message: 'School ID must be a number' })
    .int()
    .positive('School ID must be positive'),
  name: z
    .string()
    .trim()
    .min(2, 'School name must be at least 2 characters')
    .max(100, 'School name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-'.,&()]+$/,
      'School name contains invalid characters'
    ),

  address: z
    .string()
    .trim()
    .min(10, 'School address must be at least 10 characters')
    .max(200, 'School address must not exceed 200 characters'),

  region_id: z
    .number()
    .int('Schools Region ID must be an integer')
    .positive('Schools Region ID must be positive'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid school email address')
    .max(100, 'School email must not exceed 100 characters'),

  phone: z
    .string()
    .trim()
    .regex(
      /^[\+]?[1-9][\d]{0,15}$/,
      'School phone number must be valid (10-16 digits, optional + prefix)'
    )
    .transform(phone => phone.replace(/\D/g, '')), // Remove non-digits

  ownership_type: z.nativeEnum(OwnershipType, {
    errorMap: () => ({
      message: 'School ownership type must be either public or private',
    }),
  }),
});

export const schoolParamsSchema = z.object({
  id: z.coerce
    .number({ message: 'School id must be a number' })
    .int()
    .positive({
      message: 'School ID must be a positive integer',
    }),
});

export const schoolQuerySchema = z.object({
  page: z.coerce
    .number({ message: 'Page must be a number' })
    .int()
    .positive({ message: 'School ID must be a positive integer' })
    .optional()
    .default(1),
  limit: z.coerce
    .number({ message: 'Page limit must be a number' })
    .int()
    .positive({ message: 'School limit must be a positive integer' })
    .optional()
    .default(10),
  region_id: z.coerce
    .number({ message: 'Region id must be a number' })
    .int()
    .positive({
      message: 'School ID must be a positive integer',
    })
    .optional(),
  ownership_type: z.enum(['public', 'private']).optional(),
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
        message: 'School search term must be between 2 and 50 characters',
      }
    )
    .refine(
      val => {
        if (val === undefined) return true;
        // Allow letters, numbers, spaces, hyphens, apostrophes, and basic punctuation
        // Prevents SQL injection and validates allowed characters
        return /^[a-zA-Z0-9\s\-'.,&()]+$/.test(val);
      },
      {
        message: 'School search term contains invalid characters',
      }
    ),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof schoolUpdateSchema>;
export type SchoolParams = z.infer<typeof schoolParamsSchema>;
export type SchoolQuery = z.infer<typeof schoolQuerySchema>;
