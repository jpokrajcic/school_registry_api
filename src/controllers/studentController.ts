import { type Request, type Response } from 'express';
import { studentService } from '../services/studentService';
import {
  createStudentSchema,
  studentUpdateSchema,
  studentParamsSchema,
  studentQuerySchema,
  bulkCreateStudentsSchema,
  transferStudentSchema,
} from '../schemas/studentSchema';
import { handleError, handleValidationError } from '../errorHandler';

export class StudentController {
  async createStudent(req: Request, res: Response): Promise<void> {
    const validationResult = await createStudentSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE STUDENT', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const student = await studentService.createStudent(
          validationResult.data
        );

        if (!student) {
          res.status(500).json({
            success: false,
            error: 'Failed to create student',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: student,
          message: 'Student created successfully',
        });
      } catch (error) {
        handleError('Failed to create student', error, res);
      }
    }
  }

  async createStudents(req: Request, res: Response): Promise<void> {
    const validationResult = await bulkCreateStudentsSchema.safeParseAsync(
      req.body
    );

    if (handleValidationError('CREATE STUDENTS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const students = await studentService.createStudents(
          validationResult.data
        );

        if (!students) {
          res.status(500).json({
            success: false,
            error: 'Failed to create students',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            students,
            created: students.length,
            total: validationResult.data.students.length,
          },
          message: `Successfully created ${students.length} students`,
        });
      } catch (error) {
        handleError('Failed to create students', error, res);
      }
    }
  }

  async getStudents(req: Request, res: Response): Promise<void> {
    const validationResult = await studentQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET STUDENTS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await studentService.getStudents(validationResult.data);

        if (!result) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve students',
          });
          return;
        }

        const { students, total } = result;
        const { page = 1, limit = 10 } = validationResult.data;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: students,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          message: `Retrieved ${students.length} students`,
        });
      } catch (error) {
        handleError('Failed to fetch students', error, res);
      }
    }
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    const validationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('GET STUDENT BY ID', validationResult, res))
      return;

    if (validationResult.success) {
      try {
        const student = await studentService.getStudentById(
          validationResult.data.id
        );

        if (!student) {
          res.status(404).json({
            success: false,
            error: 'Student not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: student,
          message: 'Student retrieved successfully',
        });
      } catch (error) {
        handleError('Failed to fetch student by Id', error, res);
      }
    }
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await studentUpdateSchema.safeParseAsync(
      req.body
    );

    if (
      handleValidationError('UPDATE STUDENT', paramsValidationResult, res) ||
      handleValidationError('UPDATE STUDENT', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const updatedStudent = await studentService.updateStudent(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!updatedStudent) {
          res.status(500).json({
            success: false,
            error: 'Failed to update student',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: updatedStudent,
          message: 'Student updated successfully',
        });
      } catch (error) {
        handleError('Failed to update student', error, res);
      }
    }
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    const validationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('DELETE STUDENT', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await studentService.deleteStudent(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            error: 'Failed to delete student',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'Student deleted successfully',
        });
      } catch (error) {
        handleError('Failed to delete student', error, res);
      }
    }
  }

  async softDeleteStudent(req: Request, res: Response): Promise<void> {
    const validationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('SOFT DELETE STUDENT', validationResult, res))
      return;

    if (validationResult.success) {
      try {
        const deactivatedStudent = await studentService.softDeleteStudent(
          validationResult.data.id
        );

        if (!deactivatedStudent) {
          res.status(404).json({
            success: false,
            error: 'Student not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: deactivatedStudent,
          message: 'Student deactivated successfully',
        });
      } catch (error) {
        handleError('Failed to deactivate student', error, res);
      }
    }
  }

  async reactivateStudent(req: Request, res: Response): Promise<void> {
    const validationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('REACTIVATE STUDENT', validationResult, res))
      return;

    if (validationResult.success) {
      try {
        const reactivatedStudent = await studentService.reactivateStudent(
          validationResult.data.id
        );

        if (!reactivatedStudent) {
          res.status(404).json({
            success: false,
            error: 'Student not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: reactivatedStudent,
          message: 'Student reactivated successfully',
        });
      } catch (error) {
        handleError('Failed to reactivate student', error, res);
      }
    }
  }

  async transferStudent(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await studentParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await transferStudentSchema.safeParseAsync(
      req.body
    );

    if (
      handleValidationError('UPDATE STUDENT', paramsValidationResult, res) ||
      handleValidationError('UPDATE STUDENT', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const transferredStudent = await studentService.transferStudent(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!transferredStudent) {
          res.status(404).json({
            success: false,
            error: 'Student not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: transferredStudent,
          message: 'Student transferred successfully',
        });
      } catch (error) {
        handleError('Failed to transfer student', error, res);
      }
    }
  }

  async getStudentStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const statistics = await studentService.getStudentStatistics();

      if (!statistics) {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Student statistics retrieved successfully',
      });
    } catch (error) {
      handleError('Failed to fetch student statistics', error, res);
    }
  }
}

export const studentController = new StudentController();
