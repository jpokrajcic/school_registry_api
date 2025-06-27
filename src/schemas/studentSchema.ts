import { z } from 'zod';
import { Gender } from '../types/database';

export const createStudentSchema = z
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

    regionId: z
      .number()
      .int('Region ID must be an integer')
      .positive('Region ID must be positive'),

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
      .max(500, 'Address must not exceed 500 characters'),

    phone: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Phone number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(phone => phone.replace(/\D/g, '')) // Remove non-digits
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters')
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
          return age >= 3 && age <= 65; // Reasonable age range for students
        },
        {
          message: 'Student age must be between 3 and 65 years',
        }
      )
      .optional(),

    studentNumber: z
      .string()
      .trim()
      .min(3, 'Student number must be at least 3 characters')
      .max(50, 'Student number must not exceed 50 characters')
      .regex(
        /^[A-Za-z0-9-_]+$/,
        'Student number can only contain letters, numbers, hyphens, and underscores'
      ),

    schoolId: z
      .number()
      .int('School ID must be an integer')
      .positive('School ID must be positive'),

    enrollmentDate: z
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
          return date <= today;
        },
        {
          message: 'Enrollment date cannot be in the future',
        }
      )
      .optional(),

    active: z.boolean().default(true),
  })
  .strict()
  .refine(
    data => {
      // At least one contact method should be provided
      return data.phone || data.email || data.mobile;
    },
    {
      message:
        'At least one contact method (phone, email, or mobile) must be provided',
      path: ['phone'], // Show error on phone field
    }
  );

export const studentUpdateSchema = z
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
    regionId: z
      .number()
      .int('Region ID must be an integer')
      .positive('Region ID must be positive'),
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
      .max(500, 'Address must not exceed 500 characters'),
    phone: z
      .string()
      .trim()
      .regex(
        /^[\+]?[1-9][\d]{0,15}$/,
        'Phone number must be valid (10-16 digits, optional + prefix)'
      )
      .transform(phone => phone.replace(/\D/g, ''))
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .max(255, 'Email must not exceed 255 characters')
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
          return age >= 3 && age <= 25;
        },
        {
          message: 'Student age must be between 3 and 25 years',
        }
      ),
    studentNumber: z
      .string()
      .trim()
      .min(3, 'Student number must be at least 3 characters')
      .max(50, 'Student number must not exceed 50 characters')
      .regex(
        /^[A-Za-z0-9-_]+$/,
        'Student number can only contain letters, numbers, hyphens, and underscores'
      ),
    schoolId: z
      .number()
      .int('School ID must be an integer')
      .positive('School ID must be positive'),
    enrollmentDate: z
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
          return date <= today;
        },
        {
          message: 'Enrollment date cannot be in the future',
        }
      ),
    active: z.boolean(),
  })
  .strict()
  .refine(
    data => {
      // If any contact field is provided, ensure at least one is valid
      const hasContactFields =
        data.phone !== undefined ||
        data.email !== undefined ||
        data.mobile !== undefined;
      if (!hasContactFields) return true; // No contact fields being updated

      // Check if at least one contact method will be valid after update
      return data.phone || data.email || data.mobile;
    },
    {
      message:
        'At least one contact method (phone, email, or mobile) must be provided',
      path: ['phone'],
    }
  );

export const studentParamsSchema = z
  .object({
    id: z.coerce.number({ message: 'ID must be a number' }).int().positive({
      message: 'ID must be a positive integer',
    }),
  })
  .strict();

export const studentQuerySchema = z
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

    regionId: z.coerce
      .number({ message: 'Region ID must be a number' })
      .int()
      .positive({ message: 'Region ID must be a positive integer' })
      .optional(),

    schoolId: z.coerce
      .number({ message: 'School ID must be a number' })
      .int()
      .positive({ message: 'School ID must be a positive integer' })
      .optional(),

    gender: z.enum(['male', 'female']).optional(),

    active: z.coerce
      .boolean({ message: 'Active must be a boolean' })
      .optional(),

    ageRange: z
      .object({
        min: z.coerce.number().int().min(3).max(65),
        max: z.coerce.number().int().min(3).max(65),
      })
      .refine(data => data.min <= data.max, {
        message: 'Minimum age must be less than or equal to maximum age',
      })
      .optional(),

    studentNumber: z
      .string()
      .trim()
      .min(3, 'Student number must be at least 3 characters')
      .max(50, 'Student number must not exceed 50 characters')
      .regex(
        /^[A-Za-z0-9-_]+$/,
        'Student number can only contain letters, numbers, hyphens, and underscores'
      )
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
      .enum([
        'firstName',
        'lastName',
        'studentNumber',
        'enrollmentDate',
        'createdAt',
      ])
      .optional()
      .default('lastName'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .strict();

// Bulk operations schema
export const bulkCreateStudentsSchema = z
  .object({
    students: z
      .array(createStudentSchema)
      .min(1, 'At least one student must be provided')
      .max(100, 'Cannot create more than 100 students at once'),
  })
  .strict();

// Transfer student schema
export const transferStudentSchema = z
  .object({
    newSchoolId: z
      .number()
      .int('School ID must be an integer')
      .positive('School ID must be positive')
      .nullable(),

    newRegionId: z
      .number()
      .int('Region ID must be an integer')
      .positive('Region ID must be positive')
      .optional(),

    transferDate: z
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
          return date <= today;
        },
        {
          message: 'Transfer date cannot be in the future',
        }
      )
      .optional()
      .default(() => new Date()),

    reason: z
      .string()
      .trim()
      .min(5, 'Transfer reason must be at least 5 characters')
      .max(200, 'Transfer reason must not exceed 200 characters')
      .optional(),
  })
  .strict();

// Export types
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof studentUpdateSchema>;
export type StudentParams = z.infer<typeof studentParamsSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
export type BulkCreateStudentsInput = z.infer<typeof bulkCreateStudentsSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
