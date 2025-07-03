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
import { teacherSchoolService } from '../services/teacherSchoolService';

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

  async getTeacherEmploymentHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    const validationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError(
        'GET TEACHER EMPLOYMENT HISTORY',
        validationResult,
        res
      )
    )
      return;

    if (validationResult.success) {
      try {
        // Check if teacher exists
        const existingTeacher = await teacherService.getTeacherById(
          validationResult.data.id
        );

        if (!existingTeacher) {
          res.status(404).json({
            success: false,
            error: 'Teacher not found',
            code: 'TEACHER_NOT_FOUND',
          });
          return;
        }

        const employmentHistory =
          await teacherSchoolService.getTeacherEmploymentHistory(
            validationResult.data.id
          );

        if (!employmentHistory) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve teacher employment history',
          });
          return;
        }

        // Calculate summary statistics
        const activeAssignments = employmentHistory.filter(
          assignment => assignment.isActive
        );
        const completedAssignments = employmentHistory.filter(
          assignment => !assignment.isActive
        );
        const totalSchools = new Set(
          employmentHistory.map(assignment => assignment.schoolId)
        ).size;

        const totalDaysEmployed = employmentHistory.reduce(
          (total, assignment) => {
            return total + (assignment.employmentDuration || 0);
          },
          0
        );

        res.status(200).json({
          success: true,
          data: {
            teacherId: validationResult.data.id,
            teacherName: `${existingTeacher.firstName} ${existingTeacher.lastName}`,
            employmentHistory,
            summary: {
              totalAssignments: employmentHistory.length,
              activeAssignments: activeAssignments.length,
              completedAssignments: completedAssignments.length,
              totalSchoolsWorked: totalSchools,
              totalDaysEmployed,
              averageDaysPerAssignment:
                employmentHistory.length > 0
                  ? Math.round(totalDaysEmployed / employmentHistory.length)
                  : 0,
            },
          },
          message: `Retrieved employment history for ${existingTeacher.firstName} ${existingTeacher.lastName}`,
        });
      } catch (error) {
        handleError('Failed to fetch teacher employment history', error, res);
      }
    }
  }

  async getTeacherCurrentSchools(req: Request, res: Response): Promise<void> {
    const validationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError(
        'GET TEACHER CURRENT SCHOOLS',
        validationResult,
        res
      )
    )
      return;

    if (validationResult.success) {
      try {
        // Check if teacher exists
        const existingTeacher = await teacherService.getTeacherById(
          validationResult.data.id
        );

        if (!existingTeacher) {
          res.status(404).json({
            success: false,
            error: 'Teacher not found',
          });
          return;
        }

        const currentSchools =
          await teacherSchoolService.getTeacherCurrentSchools(
            validationResult.data.id
          );

        if (!currentSchools) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve teacher current schools',
          });
          return;
        }

        // Calculate additional insights
        const employmentTypes = new Set(
          currentSchools.map(school => school.employmentType)
        );
        const regions = new Set(
          currentSchools.map(school => school.regionName)
        );
        const totalDaysCurrentlyEmployed = currentSchools.reduce(
          (total, school) => {
            return total + school.daysSinceStart;
          },
          0
        );

        res.status(200).json({
          success: true,
          data: {
            teacherId: validationResult.data.id,
            teacherName: `${existingTeacher.firstName} ${existingTeacher.lastName}`,
            teacherEmail: existingTeacher.email,
            currentSchools,
            summary: {
              totalCurrentAssignments: currentSchools.length,
              employmentTypes: Array.from(employmentTypes),
              regionsWorking: Array.from(regions),
              totalRegions: regions.size,
              averageDaysAtCurrentSchools:
                currentSchools.length > 0
                  ? Math.round(
                      totalDaysCurrentlyEmployed / currentSchools.length
                    )
                  : 0,
              longestCurrentAssignment:
                currentSchools.length > 0
                  ? Math.max(
                      ...currentSchools.map(school => school.daysSinceStart)
                    )
                  : 0,
            },
          },
          message:
            currentSchools.length > 0
              ? `Teacher is currently working at ${currentSchools.length} school${currentSchools.length > 1 ? 's' : ''}`
              : 'Teacher is not currently assigned to any schools',
        });
      } catch (error) {
        handleError('Failed to fetch teacher current schools', error, res);
      }
    }
  }

  async getTeacherSchoolSummary(req: Request, res: Response): Promise<void> {
    const validationResult = await teacherParamsSchema.safeParseAsync(
      req.params
    );

    if (
      handleValidationError('GET TEACHER SCHOOL SUMMARY', validationResult, res)
    )
      return;

    if (validationResult.success) {
      try {
        // Check if teacher exists
        const existingTeacher = await teacherService.getTeacherById(
          validationResult.data.id
        );

        if (!existingTeacher) {
          res.status(404).json({
            success: false,
            error: 'Teacher not found',
          });
          return;
        }

        // Get both current and full employment history
        const [currentSchools, employmentHistory] = await Promise.all([
          teacherSchoolService.getTeacherCurrentSchools(
            validationResult.data.id
          ),
          teacherSchoolService.getTeacherEmploymentHistory(
            validationResult.data.id
          ),
        ]);

        if (!currentSchools || !employmentHistory) {
          res.status(500).json({
            success: false,
            error: 'Failed to retrieve teacher school information',
          });
          return;
        }

        // Calculate comprehensive statistics
        const activeAssignments = employmentHistory.filter(
          assignment => assignment.isActive
        );
        const completedAssignments = employmentHistory.filter(
          assignment => !assignment.isActive
        );
        const uniqueSchools = new Set(
          employmentHistory.map(assignment => assignment.schoolId)
        );
        const uniqueRegions = new Set(
          employmentHistory.map(assignment => assignment.regionName)
        );

        // Employment type breakdown
        const employmentTypeBreakdown = employmentHistory.reduce(
          (acc, assignment) => {
            acc[assignment.employmentType] =
              (acc[assignment.employmentType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Calculate career timeline
        const firstAssignment =
          employmentHistory.length > 0
            ? employmentHistory.reduce((earliest, current) =>
                current.startDate < earliest.startDate ? current : earliest
              )
            : null;

        const careerStartDate = firstAssignment?.startDate;
        const careerDaysTotal = careerStartDate
          ? Math.floor(
              (new Date().getTime() - careerStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        res.status(200).json({
          success: true,
          data: {
            teacher: {
              id: existingTeacher.id,
              name: `${existingTeacher.firstName} ${existingTeacher.lastName}`,
              email: existingTeacher.email,
              phone: existingTeacher.phone,
              mobile: existingTeacher.mobile,
            },
            currentStatus: {
              isCurrentlyEmployed: currentSchools.length > 0,
              currentSchoolCount: currentSchools.length,
              currentSchools: currentSchools.map(school => ({
                schoolName: school.schoolName,
                region: school.regionName,
                employmentType: school.employmentType,
                daysSinceStart: school.daysSinceStart,
              })),
            },
            careerSummary: {
              totalAssignments: employmentHistory.length,
              activeAssignments: activeAssignments.length,
              completedAssignments: completedAssignments.length,
              uniqueSchoolsWorked: uniqueSchools.size,
              uniqueRegionsWorked: uniqueRegions.size,
              employmentTypeBreakdown,
              careerStartDate,
              totalCareerDays: careerDaysTotal,
            },
            recentActivity: employmentHistory.slice(0, 5).map(assignment => ({
              schoolName: assignment.schoolName,
              region: assignment.regionName,
              employmentType: assignment.employmentType,
              startDate: assignment.startDate,
              endDate: assignment.endDate,
              isActive: assignment.isActive,
              duration: assignment.employmentDuration,
            })),
          },
          message: `Retrieved comprehensive school summary for ${existingTeacher.firstName} ${existingTeacher.lastName}`,
        });
      } catch (error) {
        handleError('Failed to fetch teacher school summary', error, res);
      }
    }
  }
}

export const teacherController = new TeacherController();
