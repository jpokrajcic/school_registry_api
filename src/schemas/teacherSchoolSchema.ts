import { z } from 'zod';
import { EmploymentType } from '../types/database';

const createTeacherSchoolSchema = z
  .object({
    teacherId: z
      .number()
      .int()
      .positive('Teacher ID must be a positive integer'),
    schoolId: z.number().int().positive('School ID must be a positive integer'),
    employmentType: z.nativeEnum(EmploymentType, {
      errorMap: () => ({
        message:
          'Employment type must be either full-time, part-time or contract',
      }),
    }),
    startDate: z
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
      }),
    endDate: z
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
      }),
    notes: z
      .string()
      .max(500, 'Notes must be less than 500 characters')
      .optional(),
  })
  .refine(
    data => {
      // End date must be after start date
      if (data.endDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

// Update teacher-school assignment
const updateTeacherSchoolSchema = z
  .object({
    employmentType: z.nativeEnum(EmploymentType, {
      errorMap: () => ({
        message:
          'Employment type must be either full-time, part-time or contract',
      }),
    }),
    startDate: z
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
      }),
    endDate: z
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
      }),
    isActive: z.boolean(),
    notes: z
      .string()
      .max(500, 'Notes must be less than 500 characters')
      .optional(),
  })
  .refine(
    data => {
      // If both dates provided, end date must be after start date
      if (data.endDate && data.startDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

// Query parameters for getting teacher-school assignments
const getTeacherSchoolsQuerySchema = z
  .object({
    schoolId: z.coerce
      .number({ message: 'School ID must be a number' })
      .int()
      .positive({ message: 'School ID must be a positive integer' })
      .optional(),
    teacherId: z.coerce
      .number({ message: 'Teacher ID must be a number' })
      .int()
      .positive({ message: 'Teacher ID must be a positive integer' })
      .optional(),
    employmentType: z.nativeEnum(EmploymentType, {
      errorMap: () => ({
        message:
          'Employment type must be either full-time, part-time or contract',
      }),
    }),
    isActive: z
      .string()
      .transform(val => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),
    startDateFrom: z
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
      .optional(),
    startDateTo: z
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
      .optional(),
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
  })
  .strict();

export const detailedTeacherSchoolQuerySchema = z
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

    teacherId: z.coerce
      .number({ message: 'Teacher ID must be a number' })
      .int()
      .positive({ message: 'Teacher ID must be positive' })
      .optional(),

    schoolId: z.coerce
      .number({ message: 'School ID must be a number' })
      .int()
      .positive({ message: 'School ID must be positive' })
      .optional(),

    employmentType: z
      .nativeEnum(EmploymentType, {
        errorMap: () => ({
          message:
            'Employment type must be either full-time, part-time or contract',
        }),
      })
      .optional(),

    isActive: z
      .string()
      .transform(val => val === 'true')
      .pipe(z.boolean())
      .optional(),

    startYear: z.coerce
      .number({ message: 'Start year must be a number' })
      .int()
      .min(2000)
      .max(new Date().getFullYear())
      .optional(),

    includeSchoolDetails: z
      .string()
      .transform(val => val === 'true')
      .pipe(z.boolean())
      .optional(),

    includeTeacherDetails: z
      .string()
      .transform(val => val === 'true')
      .pipe(z.boolean())
      .optional(),
  })
  .strict();

export type GetTeacherSchoolsQuery = z.infer<
  typeof getTeacherSchoolsQuerySchema
>;
export type CreateTeacherSchoolInput = z.infer<
  typeof createTeacherSchoolSchema
>;
export type UpdateTeacherSchoolInput = z.infer<
  typeof updateTeacherSchoolSchema
>;
export type DetailedTeacherSchoolQuery = z.infer<
  typeof detailedTeacherSchoolQuerySchema
>;
