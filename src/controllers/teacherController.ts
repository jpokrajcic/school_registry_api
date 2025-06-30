import { type Request, type Response } from 'express';
import { teacherService } from '../services/teacherService';
import {
  createTeacherSchema,
  teacherUpdateSchema,
  teacherParamsSchema,
  teacherQuerySchema,
  bulkCreateTeachersSchema,
} from '../schemas/teacherSchema';
import { handleError, handleValidationError } from '../errorHandler';

export class TeacherController {
  async createTeacher(req: Request, res: Response): Promise<void> {
    const validationResult = await createTeacherSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE TEACHER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const teacher = await teacherService.createTeacher(
          validationResult.data
        );

        if (!teacher) {
          res.status(500).json({
            success: false,
            error: 'Failed to create teacher',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: teacher,
          message: 'Teacher created successfully',
        });
      } catch (error) {
        handleError('Failed to create teacher', error, res);
      }
    }
  }

  async createTeachers(req: Request, res: Response): Promise<void> {
    const validationResult = await bulkCreateTeachersSchema.safeParseAsync(
      req.body
    );

    if (handleValidationError('CREATE TEACHERS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const teachers = await teacherService.createTeachers(
          validationResult.data
        );

        if (!teachers) {
          res.status(500).json({
            success: false,
            error: 'Failed to create teachers',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            teachers,
            created: teachers.length,
            total: validationResult.data.teachers.length,
          },
          message: `Successfully created ${teachers.length} teachers`,
        });
      } catch (error) {
        handleError('Failed to create teachers', error, res);
      }
    }
  }

  async getTeachers(req: Request, res: Response): Promise<void> {
    const validationResult = await teacherQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET TEACHERS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await teacherService.getTeachers(validationResult.data);

        if (!result) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve teachers',
          });
          return;
        }

        const { teachers, total } = result;
        const { page = 1, limit = 10 } = validationResult.data;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: teachers,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          message: `Retrieved ${teachers.length} teachers`,
        });
      } catch (error) {
        handleError('Failed to fetch teachers', error, res);
      }
    }
  }

  async getTeacherById(req: Request, res: Response): Promise<void> {
    const validationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('GET TEACHER BY ID', validationResult, res))
      return;

    if (validationResult.success) {
      try {
        const teacher = await teacherService.getTeacherById(
          validationResult.data.id
        );

        if (!teacher) {
          res.status(404).json({
            success: false,
            error: 'Teacher not found',
            code: 'TEACHER_NOT_FOUND',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: teacher,
          message: 'Teacher retrieved successfully',
        });
      } catch (error) {
        handleError('Failed to fetch teacher by Id', error, res);
      }
    }
  }

  async updateTeacher(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await teacherUpdateSchema.safeParseAsync(
      req.body
    );

    if (
      handleValidationError('UPDATE TEACHER', paramsValidationResult, res) ||
      handleValidationError('UPDATE TEACHER', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const updatedTeacher = await teacherService.updateTeacher(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!updatedTeacher) {
          res.status(500).json({
            success: false,
            error: 'Failed to update teacher',
            code: 'UPDATE_FAILED',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: updatedTeacher,
          message: 'Teacher updated successfully',
        });
      } catch (error) {
        handleError('Failed to update teacher', error, res);
      }
    }
  }

  async deleteTeacher(req: Request, res: Response): Promise<void> {
    const validationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('DELETE TEACHER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await teacherService.deleteTeacher(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(500).json({
            success: false,
            error: 'Failed to delete teacher',
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Teacher deleted successfully',
        });
      } catch (error) {
        handleError('Failed to delete teacher', error, res);
      }
    }
  }
}

export const teacherController = new TeacherController();
