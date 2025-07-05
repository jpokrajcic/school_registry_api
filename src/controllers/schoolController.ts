import { type Request, type Response } from 'express';
import {
  createSchoolSchema,
  schoolParamsSchema,
  schoolQuerySchema,
  schoolUpdateSchema,
} from '../schemas/schoolSchema';
import { schoolService } from '../services/schoolService';
import { handleValidationError, handleError } from '../errorHandler';
import { teacherSchoolService } from '../services/teacherSchoolService';
import type { School } from '../types/database';
import { detailedTeacherSchoolQuerySchema } from '../schemas/teacherSchoolSchema';

export class SchoolController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createSchoolSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const school = await schoolService.createSchool(validationResult.data);

        if (!school) {
          res.status(404).json({
            success: false,
            error: 'Failed to create school',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: school,
          message: 'School created successfully',
        });
      } catch (error) {
        handleError('Failed to create school', error, res);
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET SCHOOLS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await schoolService.getSchools(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No schools found',
          });
          return;
        }

        const { schools, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: schools,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleError('Failed to fetch schools', error, res);
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('GET SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const school = await schoolService.getSchoolById(
          validationResult.data.id
        );

        if (!school) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.json({
          success: true,
          data: school,
        });
      } catch (error) {
        handleError('Failed to fetch school', error, res);
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await schoolUpdateSchema.safeParseAsync(
      req.body
    );

    if (
      handleValidationError('UPDATE SCHOOL', paramsValidationResult, res) ||
      handleValidationError('UPDATE SCHOOL', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const school = await schoolService.updateSchool(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!school) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: school,
          message: 'School updated successfully',
        });
      } catch (error) {
        handleError('Failed to update school', error, res);
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('DELETE SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await schoolService.deleteSchool(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'School deleted successfully',
        });
      } catch (error) {
        handleError('Failed to delete school', error, res);
      }
    }
  }

  async getSchoolEmploymentHistory(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError(
        'GET SCHOOL EMPLOYMENT HISTORY',
        validationResult,
        res
      )
    )
      return;

    if (validationResult.success) {
      try {
        // Check if school exists
        const existingSchool: School | undefined =
          await schoolService.getSchoolById(validationResult.data.id);

        if (!existingSchool) {
          res.status(404).json({
            success: false,
            error: 'School not found',
          });
          return;
        }

        const employmentHistory =
          await teacherSchoolService.getSchoolEmploymentHistory(
            validationResult.data.id
          );

        if (!employmentHistory) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve school employment history',
          });
          return;
        }

        // Calculate summary statistics
        const activeTeachers = employmentHistory.filter(
          assignment => assignment.isActive
        );
        const formerTeachers = employmentHistory.filter(
          assignment => !assignment.isActive
        );
        const uniqueTeachers = new Set(
          employmentHistory.map(assignment => assignment.teacherId)
        ).size;

        // Employment type breakdown
        const employmentTypeBreakdown = employmentHistory.reduce(
          (acc, assignment) => {
            acc[assignment.employmentType] =
              (acc[assignment.employmentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Calculate total employment days
        const totalEmploymentDays = employmentHistory.reduce(
          (total, assignment) => {
            return total + (assignment.employmentDuration || 0);
          },
          0
        );

        res.status(200).json({
          success: true,
          data: {
            schoolId: validationResult.data.id,
            schoolName: existingSchool.name,
            schoolAddress: existingSchool.address,
            employmentHistory,
            summary: {
              totalAssignments: employmentHistory.length,
              currentTeachers: activeTeachers.length,
              formerTeachers: formerTeachers.length,
              uniqueTeachersWorked: uniqueTeachers,
              employmentTypeBreakdown,
              totalEmploymentDays,
              averageDaysPerAssignment:
                employmentHistory.length > 0
                  ? Math.round(totalEmploymentDays / employmentHistory.length)
                  : 0,
            },
          },
          message: `Retrieved employment history for ${existingSchool.name}`,
        });
      } catch (error) {
        handleError('Failed to fetch school employment history', error, res);
      }
    }
  }

  async getSchoolTeacherAssignments(
    req: Request,
    res: Response
  ): Promise<void> {
    const paramsValidationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );
    const queryValidationResult =
      await detailedTeacherSchoolQuerySchema.safeParseAsync(req.query);

    if (
      handleValidationError(
        'GET SCHOOL TEACHER ASSIGNMENTS',
        paramsValidationResult,
        res
      ) ||
      handleValidationError(
        'GET SCHOOL TEACHER ASSIGNMENTS',
        queryValidationResult,
        res
      )
    )
      return;

    if (paramsValidationResult.success && queryValidationResult.success) {
      try {
        // Check if school exists
        const existingSchool = await schoolService.getSchoolById(
          paramsValidationResult.data.id
        );

        if (!existingSchool) {
          res.status(404).json({
            success: false,
            error: 'School not found',
          });
          return;
        }

        // Add schoolId to query and ensure teacher details are included
        const queryWithSchoolId = {
          ...queryValidationResult.data,
          schoolId: paramsValidationResult.data.id,
          includeTeacherDetails: true,
          includeSchoolDetails: false, // We already have school info
        };

        const result =
          await teacherSchoolService.getDetailedTeacherSchoolAssignments(
            queryWithSchoolId
          );

        if (!result) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve teacher assignments',
          });
          return;
        }

        const { assignments, total } = result;
        const { page = 1, limit = 10 } = queryValidationResult.data;
        const totalPages = Math.ceil(total / limit);

        // Calculate additional insights
        const activeAssignments = assignments.filter(
          assignment => assignment.isActive
        );
        const employmentTypes = new Set(
          assignments.map(assignment => assignment.employmentType)
        );

        res.status(200).json({
          success: true,
          data: {
            school: {
              id: existingSchool.id,
              name: existingSchool.name,
              address: existingSchool.address,
              email: existingSchool.email,
              phone: existingSchool.phone,
            },
            assignments,
            summary: {
              totalAssignments: assignments.length,
              activeAssignments: activeAssignments.length,
              employmentTypes: Array.from(employmentTypes),
              uniqueTeachers: new Set(assignments.map(a => a.teacherId)).size,
            },
          },
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          message: `Retrieved ${assignments.length} teacher assignments for ${existingSchool.name}`,
        });
      } catch (error) {
        handleError('Failed to fetch school teacher assignments', error, res);
      }
    }
  }

  async getSchoolCurrentTeachers(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError(
        'GET SCHOOL CURRENT TEACHERS',
        validationResult,
        res
      )
    )
      return;

    if (validationResult.success) {
      try {
        // Check if school exists
        const existingSchool = await schoolService.getSchoolById(
          validationResult.data.id
        );

        if (!existingSchool) {
          res.status(404).json({
            success: false,
            error: 'School not found',
          });
          return;
        }

        // Get current active teachers with details
        const result =
          await teacherSchoolService.getDetailedTeacherSchoolAssignments({
            schoolId: validationResult.data.id,
            isActive: true,
            includeTeacherDetails: true,
            includeSchoolDetails: false,
            limit: 100, // Get all current teachers
            page: 1,
          });

        if (!result) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve current teachers',
          });
          return;
        }

        const { assignments } = result;

        // Calculate insights
        const employmentTypeBreakdown = assignments.reduce(
          (acc, assignment) => {
            acc[assignment.employmentType] =
              (acc[assignment.employmentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const averageEmploymentDuration =
          assignments.length > 0
            ? Math.round(
                assignments.reduce(
                  (total, assignment) =>
                    total + (assignment.employmentDuration || 0),
                  0
                ) / assignments.length
              )
            : 0;

        res.status(200).json({
          success: true,
          data: {
            school: {
              id: existingSchool.id,
              name: existingSchool.name,
              address: existingSchool.address,
              email: existingSchool.email,
              phone: existingSchool.phone,
            },
            currentTeachers: assignments.map(assignment => ({
              assignmentId: assignment.assignmentId,
              teacherId: assignment.teacherId,
              teacherName: `${assignment.teacherFirstName} ${assignment.teacherLastName}`,
              teacherEmail: assignment.teacherEmail,
              employmentType: assignment.employmentType,
              startDate: assignment.startDate,
              daysSinceStart: assignment.employmentDuration,
            })),
            summary: {
              totalCurrentTeachers: assignments.length,
              employmentTypeBreakdown,
              averageEmploymentDuration,
              longestServingTeacher:
                assignments.length > 0
                  ? Math.max(...assignments.map(a => a.employmentDuration || 0))
                  : 0,
            },
          },
          message:
            assignments.length > 0
              ? `School currently has ${assignments.length} active teacher${assignments.length > 1 ? 's' : ''}`
              : 'School has no current teachers assigned',
        });
      } catch (error) {
        handleError('Failed to fetch school current teachers', error, res);
      }
    }
  }

  async getSchoolTeacherSummary(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError('GET SCHOOL TEACHER SUMMARY', validationResult, res)
    )
      return;

    if (validationResult.success) {
      try {
        // Check if school exists
        const existingSchool = await schoolService.getSchoolById(
          validationResult.data.id
        );

        if (!existingSchool) {
          res.status(404).json({
            success: false,
            error: 'School not found',
          });
          return;
        }

        // Get both current and full employment history
        const [employmentHistory, currentTeachersResult] = await Promise.all([
          teacherSchoolService.getSchoolEmploymentHistory(
            validationResult.data.id
          ),
          teacherSchoolService.getDetailedTeacherSchoolAssignments({
            schoolId: validationResult.data.id,
            isActive: true,
            includeTeacherDetails: true,
            includeSchoolDetails: false,
            limit: 100,
            page: 1,
          }),
        ]);

        if (!employmentHistory || !currentTeachersResult) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve school teacher information',
            code: 'FETCH_FAILED',
          });
          return;
        }

        const { assignments: currentTeachers } = currentTeachersResult;

        // Calculate comprehensive statistics
        const activeTeachers = employmentHistory.filter(
          assignment => assignment.isActive
        );
        const formerTeachers = employmentHistory.filter(
          assignment => !assignment.isActive
        );
        const uniqueTeachers = new Set(
          employmentHistory.map(assignment => assignment.teacherId)
        ).size;

        // Employment type breakdown
        const employmentTypeBreakdown = employmentHistory.reduce(
          (acc, assignment) => {
            acc[assignment.employmentType] =
              (acc[assignment.employmentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Calculate school timeline
        const firstHire =
          employmentHistory.length > 0
            ? employmentHistory.reduce((earliest, current) =>
                current.startDate < earliest.startDate ? current : earliest
              )
            : null;

        const schoolOperatingDays = firstHire
          ? Math.floor(
              (new Date().getTime() - firstHire.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        res.status(200).json({
          success: true,
          data: {
            school: {
              id: existingSchool.id,
              name: existingSchool.name,
              address: existingSchool.address,
              email: existingSchool.email,
              phone: existingSchool.phone,
            },
            currentStatus: {
              hasActiveTeachers: currentTeachers.length > 0,
              currentTeacherCount: currentTeachers.length,
              currentTeachers: currentTeachers.map(teacher => ({
                teacherName: `${teacher.teacherFirstName} ${teacher.teacherLastName}`,
                employmentType: teacher.employmentType,
                daysSinceStart: teacher.employmentDuration,
              })),
            },
            historicalSummary: {
              totalAssignments: employmentHistory.length,
              activeTeachers: activeTeachers.length,
              formerTeachers: formerTeachers.length,
              uniqueTeachersWorked: uniqueTeachers,
              employmentTypeBreakdown,
              firstHireDate: firstHire?.startDate,
              schoolOperatingDays,
            },
            recentActivity: employmentHistory.slice(0, 5).map(assignment => ({
              teacherName: `${assignment.teacherFirstName} ${assignment.teacherLastName}`,
              employmentType: assignment.employmentType,
              startDate: assignment.startDate,
              endDate: assignment.endDate,
              isActive: assignment.isActive,
              duration: assignment.employmentDuration,
            })),
          },
          message: `Retrieved comprehensive teacher summary for ${existingSchool.name}`,
        });
      } catch (error) {
        handleError('Failed to fetch school teacher summary', error, res);
      }
    }
  }
}

export const schoolController = new SchoolController();
