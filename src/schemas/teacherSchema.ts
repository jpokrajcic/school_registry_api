import { z } from 'zod';
import { Gender } from '../types/database';

export const createTeacherSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must not exceed 100 characters'),

    middleName: z
      .string()
      .trim()
      .max(100, 'Middle name must not exceed 100 characters')
      .default(''), // Allow empty middle name

    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name must not exceed 100 characters'),

    postCode: z
      .string()
      .trim()
      .min(3, 'Post code must be at least 3 characters')
      .max(20, 'Post code must not exceed 20 characters')
      .regex(/^[A-Za-z0-9\s-]+$/, 'Post code contains invalid characters'),

    address: z
      .string()
      .trim()
      .min(10, 'Address must be at least 10 characters')
      .max(255, 'Address must not exceed 255 characters'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters'),

    phone: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Phone number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(phone => phone.replace(/\D/g, '')) // Remove non-digits
      .optional(),

    mobile: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Mobile number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(mobile => mobile.replace(/\D/g, '')) // Remove non-digits
      .optional(),

    gender: z.nativeEnum(Gender, {
      errorMap: () => ({
        message: 'Gender must be either male or female',
      }),
    }),

    dateOfBirth: z
      .string()
      .or(z.date())
      .transform(val => {
        if (typeof val === 'string') {
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
          }
          return date;
        }
        return val;
      })
      .refine(
        date => {
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          return age >= 18 && age <= 70; // Reasonable age range for teachers
        },
        {
          message: 'Teacher age must be between 18 and 70 years',
        }
      )
      .optional(),
  })
  .strict()
  .refine(
    data => {
      // At least one contact method should be provided
      return data.phone || data.mobile;
    },
    {
      message: 'At least one contact method (phone or mobile) must be provided',
      path: ['phone'], // Show error on phone field
    }
  );

export const teacherUpdateSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must not exceed 100 characters'),

    middleName: z
      .string()
      .trim()
      .max(100, 'Middle name must not exceed 100 characters')
      .optional(),

    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name must not exceed 100 characters'),

    postCode: z
      .string()
      .trim()
      .min(3, 'Post code must be at least 3 characters')
      .max(20, 'Post code must not exceed 20 characters')
      .regex(/^[A-Za-z0-9\s-]+$/, 'Post code contains invalid characters'),

    address: z
      .string()
      .trim()
      .min(10, 'Address must be at least 10 characters')
      .max(255, 'Address must not exceed 255 characters'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters'),

    phone: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Phone number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(phone => phone.replace(/\D/g, ''))
      .optional(),

    mobile: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Mobile number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(mobile => mobile.replace(/\D/g, ''))
      .optional(),

    gender: z.nativeEnum(Gender, {
      errorMap: () => ({
        message: 'Gender must be either male or female',
      }),
    }),

    dateOfBirth: z
      .string()
      .or(z.date())
      .transform(val => {
        if (typeof val === 'string') {
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
          }
          return date;
        }
        return val;
      })
      .refine(
        date => {
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          return age >= 18 && age <= 70;
        },
        {
          message: 'Teacher age must be between 18 and 70 years',
        }
      )
      .optional(),
  })
  .strict()
  .refine(
    data => {
      // If any contact field is provided, ensure at least one is valid
      const hasContactFields =
        data.phone !== undefined || data.mobile !== undefined;
      if (!hasContactFields) return true; // No contact fields being updated

      // Check if at least one contact method will be valid after update
      return data.phone || data.mobile;
    },
    {
      message: 'At least one contact method (phone or mobile) must be provided',
      path: ['phone'],
    }
  );

export const teacherParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'ID must be a number' }).int().positive({
      message: 'ID must be a positive integer',
    }),
  })
  .strict();

export const teacherQuerySchema = z
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
      .max(100, 'Page limit cannot exceed 100')
      .optional()
      .default(10),

    gender: z.enum(['male', 'female']).optional(),

    ageRange: z
      .object({
        min: z.coerce.number().int().min(18).max(70),
        max: z.coerce.number().int().min(18).max(70),
      })
      .refine(data => data.min <= data.max, {
        message: 'Minimum age must be less than or equal to maximum age',
      })
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

    sortBy: z
      .enum(['firstName', 'lastName', 'email', 'createdAt'])
      .optional()
      .default('lastName'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .strict();

// Bulk operations schema
export const bulkCreateTeachersSchema = z
  .object({
    teachers: z
      .array(createTeacherSchema)
      .min(1, 'At least one teacher must be provided')
      .max(100, 'Cannot create more than 100 teachers at once'),
  })
  .strict();

// Export types
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof teacherUpdateSchema>;
export type TeacherParams = z.infer<typeof teacherParamsSchema>;
export type TeacherQuery = z.infer<typeof teacherQuerySchema>;
export type BulkCreateTeachersInput = z.infer<typeof bulkCreateTeachersSchema>;
