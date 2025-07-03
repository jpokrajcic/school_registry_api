import { db } from '../config/database';
import { databaseErrorThrower } from '../errorHandler';
import {
  type CreateTeacherSchoolInput,
  type UpdateTeacherSchoolInput,
  type DetailedTeacherSchoolQuery,
} from '../schemas/teacherSchoolSchema';
import {
  type TeacherSchool,
  type NewTeacherSchool,
  type TeacherSchoolUpdate,
  EmploymentType,
} from '../types/database';

export class TeacherSchoolService {
  async assignTeacherToSchool(
    input: CreateTeacherSchoolInput
  ): Promise<TeacherSchool | undefined> {
    try {
      // Check for existing active assignment
      const existingAssignment = await db
        .selectFrom('teacherSchools')
        .selectAll()
        .where('teacherId', '=', input.teacherId)
        .where('schoolId', '=', input.schoolId)
        .where('isActive', '=', true)
        .executeTakeFirst();

      if (existingAssignment) {
        throw new Error('Teacher is already actively assigned to this school');
      }

      const newAssignment: NewTeacherSchool = {
        teacherId: input.teacherId,
        schoolId: input.schoolId,
        employmentType: input.employmentType,
        startDate: input.startDate,
        endDate: input.endDate || null,
        isActive: input.startDate && !input.endDate,
      };

      return await db
        .insertInto('teacherSchools')
        .values(newAssignment)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to assign teacher to school', error);
    }

    return;
  }

  async getTeacherSchoolAssignments(
    query: DetailedTeacherSchoolQuery
  ): Promise<{ assignments: TeacherSchool[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('teacherSchools');

      // Apply filters
      if (query.teacherId) {
        dbQuery = dbQuery.where('teacherId', '=', query.teacherId);
      }

      if (query.schoolId) {
        dbQuery = dbQuery.where('schoolId', '=', query.schoolId);
      }

      if (query.employmentType) {
        dbQuery = dbQuery.where(
          'employmentType',
          '=',
          query.employmentType as EmploymentType
        );
      }

      if (query.isActive !== undefined) {
        dbQuery = dbQuery.where('isActive', '=', query.isActive);
      }

      if (query.startYear) {
        const startOfYear = new Date(query.startYear, 0, 1);
        const endOfYear = new Date(query.startYear, 11, 31);
        dbQuery = dbQuery
          .where('startDate', '>=', startOfYear)
          .where('startDate', '<=', endOfYear);
      }

      // Get total count
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Apply pagination and get results
      const assignments = await dbQuery
        .selectAll()
        .orderBy('startDate', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { assignments, total };
    } catch (error) {
      databaseErrorThrower('Failed to get teacher school assignments', error);
    }

    return;
  }

  async getTeacherSchoolAssignmentById(
    id: number
  ): Promise<TeacherSchool | undefined> {
    try {
      return await db
        .selectFrom('teacherSchools')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get teacher school assignment', error);
    }

    return;
  }

  async getActiveTeachersBySchool(
    schoolId: number
  ): Promise<TeacherSchool[] | undefined> {
    try {
      return await db
        .selectFrom('teacherSchools')
        .selectAll()
        .where('schoolId', '=', schoolId)
        .where('isActive', '=', true)
        .orderBy('startDate', 'desc')
        .execute();
    } catch (error) {
      databaseErrorThrower('Failed to get active teachers by school', error);
    }

    return;
  }

  async getActiveSchoolsByTeacher(
    teacherId: number
  ): Promise<TeacherSchool[] | undefined> {
    try {
      return await db
        .selectFrom('teacherSchools')
        .selectAll()
        .where('teacherId', '=', teacherId)
        .where('isActive', '=', true)
        .orderBy('startDate', 'desc')
        .execute();
    } catch (error) {
      databaseErrorThrower('Failed to get active schools by teacher', error);
    }

    return;
  }

  async updateTeacherSchoolAssignment(
    id: number,
    input: UpdateTeacherSchoolInput
  ): Promise<TeacherSchool | undefined> {
    try {
      const updateData: TeacherSchoolUpdate = {
        ...input,
      };

      return await db
        .updateTable('teacherSchools')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update teacher school assignment', error);
    }

    return;
  }

  async terminateEmployment(
    id: number,
    endDate: Date
  ): Promise<TeacherSchool | undefined> {
    try {
      return await db.transaction().execute(async trx => {
        // Check if assignment exists and is active
        const assignment = await trx
          .selectFrom('teacherSchools')
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirst();

        if (!assignment) {
          throw new Error('Assignment not found');
        }

        if (!assignment.isActive) {
          throw new Error('Assignment is already terminated');
        }

        if (endDate < assignment.startDate) {
          throw new Error('End date cannot be before start date');
        }

        // Update assignment
        return await trx
          .updateTable('teacherSchools')
          .set({
            endDate,
            isActive: false,
          })
          .where('id', '=', id)
          .returningAll()
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      databaseErrorThrower('Failed to terminate employment', error);
    }

    return;
  }

  async deleteTeacherSchoolAssignment(
    id: number
  ): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('teacherSchools')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete teacher school assignment', error);
    }

    return;
  }

  async getAssignmentStatistics(): Promise<
    | {
        totalAssignments: number;
        activeAssignments: number;
        byEmploymentType: Array<{ type: string; count: number }>;
        bySchool: Array<{ schoolId: number; count: number }>;
        averageEmploymentDuration: number | null; // in days
      }
    | undefined
  > {
    try {
      const [
        totalResult,
        activeResult,
        employmentTypeResults,
        schoolResults,
        durationResults,
      ] = await Promise.all([
        // Total assignments
        db
          .selectFrom('teacherSchools')
          .select(eb => eb.fn.countAll().as('count'))
          .executeTakeFirst(),

        // Active assignments
        db
          .selectFrom('teacherSchools')
          .select(eb => eb.fn.countAll().as('count'))
          .where('isActive', '=', true)
          .executeTakeFirst(),

        // By employment type
        db
          .selectFrom('teacherSchools')
          .select([
            'employmentType as type',
            eb => eb.fn.countAll().as('count'),
          ])
          .groupBy('employmentType')
          .execute(),

        // By school
        db
          .selectFrom('teacherSchools')
          .select(['schoolId', eb => eb.fn.countAll().as('count')])
          .where('isActive', '=', true)
          .groupBy('schoolId')
          .execute(),

        // Average duration (for completed assignments)
        db
          .selectFrom('teacherSchools')
          .select(eb =>
            eb.fn
              .avg(
                eb.fn('EXTRACT', [
                  eb.val('DAY'),
                  eb.fn('AGE', ['endDate', 'startDate']),
                ])
              )
              .as('avgDuration')
          )
          .where('endDate', 'is not', null)
          .executeTakeFirst(),
      ]);

      return {
        totalAssignments: Number(totalResult?.count || 0),
        activeAssignments: Number(activeResult?.count || 0),
        byEmploymentType: employmentTypeResults.map(r => ({
          type: r.type,
          count: Number(r.count),
        })),
        bySchool: schoolResults.map(r => ({
          schoolId: r.schoolId,
          count: Number(r.count),
        })),
        averageEmploymentDuration: durationResults?.avgDuration
          ? Math.round(Number(durationResults.avgDuration))
          : null,
      };
    } catch (error) {
      databaseErrorThrower('Failed to get assignment statistics', error);
    }

    return;
  }

  async getTeacherEmploymentHistory(teacherId: number): Promise<
    | Array<{
        assignmentId: number;
        teacherId: number;
        schoolId: number;
        schoolName: string;
        schoolAddress: string;
        schoolEmail: string;
        schoolPhone: string;
        regionName: string;
        ownershipType: string;
        employmentType: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        employmentDuration: number | null; // in days
        createdAt: Date;
      }>
    | undefined
  > {
    try {
      const employmentHistory = await db
        .selectFrom('teacherSchools')
        .innerJoin('schools', 'schools.id', 'teacherSchools.schoolId')
        .innerJoin('regions', 'regions.id', 'schools.regionId')
        .select([
          'teacherSchools.id as assignmentId',
          'teacherSchools.teacherId',
          'teacherSchools.schoolId',
          'schools.name as schoolName',
          'schools.address as schoolAddress',
          'schools.email as schoolEmail',
          'schools.phone as schoolPhone',
          'regions.name as regionName',
          'schools.ownershipType',
          'teacherSchools.employmentType',
          'teacherSchools.startDate',
          'teacherSchools.endDate',
          'teacherSchools.isActive',
          'teacherSchools.createdAt',
        ])
        .where('teacherSchools.teacherId', '=', teacherId)
        .orderBy('teacherSchools.startDate', 'desc')
        .execute();

      // Calculate employment duration for each assignment
      return employmentHistory.map(assignment => ({
        ...assignment,
        employmentDuration: assignment['endDate']
          ? Math.floor(
              (assignment['endDate'].getTime() -
                assignment['startDate'].getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : assignment['isActive']
            ? Math.floor(
                (new Date().getTime() - assignment['startDate'].getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
      }));
    } catch (error) {
      databaseErrorThrower('Failed to get teacher employment history', error);
    }

    return;
  }

  async getSchoolEmploymentHistory(schoolId: number): Promise<
    | Array<{
        assignmentId: number;
        teacherId: number;
        teacherFirstName: string;
        teacherMiddleName: string;
        teacherLastName: string;
        teacherEmail: string;
        teacherPhone: string | null;
        teacherMobile: string | null;
        schoolId: number;
        employmentType: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        employmentDuration: number | null; // in days
        createdAt: Date;
      }>
    | undefined
  > {
    try {
      const employmentHistory = await db
        .selectFrom('teacherSchools')
        .innerJoin('teachers', 'teachers.id', 'teacherSchools.teacherId')
        .select([
          'teacherSchools.id as assignmentId',
          'teacherSchools.teacherId',
          'teachers.firstName as teacherFirstName',
          'teachers.middleName as teacherMiddleName',
          'teachers.lastName as teacherLastName',
          'teachers.email as teacherEmail',
          'teachers.phone as teacherPhone',
          'teachers.mobile as teacherMobile',
          'teacherSchools.schoolId',
          'teacherSchools.employmentType',
          'teacherSchools.startDate',
          'teacherSchools.endDate',
          'teacherSchools.isActive',
          'teacherSchools.createdAt',
        ])
        .where('teacherSchools.schoolId', '=', schoolId)
        .orderBy('teacherSchools.startDate', 'desc')
        .execute();

      // Calculate employment duration for each assignment
      return employmentHistory.map(assignment => ({
        ...assignment,
        employmentDuration: assignment['endDate']
          ? Math.floor(
              (assignment['endDate'].getTime() -
                assignment['startDate'].getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : assignment['isActive']
            ? Math.floor(
                (new Date().getTime() - assignment['startDate'].getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
      }));
    } catch (error) {
      databaseErrorThrower('Failed to get school employment history', error);
    }

    return;
  }

  async getDetailedTeacherSchoolAssignments(
    query: DetailedTeacherSchoolQuery & {
      includeSchoolDetails?: boolean;
      includeTeacherDetails?: boolean;
    }
  ): Promise<
    | {
        assignments: Array<{
          assignmentId: number;
          teacherId: number;
          teacherFirstName?: string;
          teacherLastName?: string;
          teacherEmail?: string;
          schoolId: number;
          schoolName?: string;
          schoolAddress?: string;
          regionName?: string;
          ownershipType?: string;
          employmentType: string;
          startDate: Date;
          endDate: Date | null;
          isActive: boolean;
          employmentDuration: number | null;
          createdAt: Date;
        }>;
        total: number;
      }
    | undefined
  > {
    try {
      let dbQuery = db.selectFrom('teacherSchools');

      // Join with schools table if school details are requested
      if (query.includeSchoolDetails) {
        dbQuery = dbQuery
          .innerJoin('schools', 'schools.id', 'teacherSchools.schoolId')
          .innerJoin('regions', 'regions.id', 'schools.regionId');
      }

      // Join with teachers table if teacher details are requested
      if (query.includeTeacherDetails) {
        dbQuery = dbQuery.innerJoin(
          'teachers',
          'teachers.id',
          'teacherSchools.teacherId'
        );
      }

      // Apply filters
      if (query.teacherId) {
        dbQuery = dbQuery.where(
          'teacherSchools.teacherId',
          '=',
          query.teacherId
        );
      }

      if (query.schoolId) {
        dbQuery = dbQuery.where('teacherSchools.schoolId', '=', query.schoolId);
      }

      if (query.employmentType) {
        dbQuery = dbQuery.where(
          'teacherSchools.employmentType',
          '=',
          query.employmentType as EmploymentType
        );
      }

      if (query.isActive !== undefined) {
        dbQuery = dbQuery.where('teacherSchools.isActive', '=', query.isActive);
      }

      if (query.startYear) {
        const startOfYear = new Date(query.startYear, 0, 1);
        const endOfYear = new Date(query.startYear, 11, 31);
        dbQuery = dbQuery
          .where('teacherSchools.startDate', '>=', startOfYear)
          .where('teacherSchools.startDate', '<=', endOfYear);
      }

      // Get total count
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Build select fields dynamically
      const selectFields: any[] = [
        'teacherSchools.id as assignmentId',
        'teacherSchools.teacherId',
        'teacherSchools.schoolId',
        'teacherSchools.employmentType',
        'teacherSchools.startDate',
        'teacherSchools.endDate',
        'teacherSchools.isActive',
        'teacherSchools.createdAt',
      ];

      if (query.includeSchoolDetails) {
        selectFields.push(
          'schools.name as schoolName',
          'schools.address as schoolAddress',
          'regions.name as regionName',
          'schools.ownershipType'
        );
      }

      if (query.includeTeacherDetails) {
        selectFields.push(
          'teachers.firstName as teacherFirstName',
          'teachers.lastName as teacherLastName',
          'teachers.email as teacherEmail'
        );
      }

      // Apply pagination and get results
      const rawAssignments = await dbQuery
        .select(selectFields)
        .orderBy('teacherSchools.startDate', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      // Calculate employment duration for each assignment
      const assignments = rawAssignments.map(assignment => ({
        ...assignment,
        employmentDuration: assignment['endDate']
          ? Math.floor(
              (assignment['endDate'].getTime() -
                assignment['startDate'].getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : assignment['isActive']
            ? Math.floor(
                (new Date().getTime() - assignment['startDate'].getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
      })) as Array<{
        assignmentId: number;
        teacherId: number;
        teacherFirstName?: string;
        teacherLastName?: string;
        teacherEmail?: string;
        schoolId: number;
        schoolName?: string;
        schoolAddress?: string;
        regionName?: string;
        ownershipType?: string;
        employmentType: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        employmentDuration: number | null;
        createdAt: Date;
      }>;

      return { assignments, total };
    } catch (error) {
      databaseErrorThrower(
        'Failed to get detailed teacher school assignments',
        error
      );
    }

    return;
  }

  async getTeacherCurrentSchools(teacherId: number): Promise<
    | Array<{
        assignmentId: number;
        schoolId: number;
        schoolName: string;
        schoolAddress: string;
        schoolEmail: string;
        schoolPhone: string;
        regionName: string;
        ownershipType: string;
        employmentType: string;
        startDate: Date;
        daysSinceStart: number;
      }>
    | undefined
  > {
    try {
      const currentSchools = await db
        .selectFrom('teacherSchools')
        .innerJoin('schools', 'schools.id', 'teacherSchools.schoolId')
        .innerJoin('regions', 'regions.id', 'schools.regionId')
        .select([
          'teacherSchools.id as assignmentId',
          'teacherSchools.schoolId',
          'schools.name as schoolName',
          'schools.address as schoolAddress',
          'schools.email as schoolEmail',
          'schools.phone as schoolPhone',
          'regions.name as regionName',
          'schools.ownershipType',
          'teacherSchools.employmentType',
          'teacherSchools.startDate',
        ])
        .where('teacherSchools.teacherId', '=', teacherId)
        .where('teacherSchools.isActive', '=', true)
        .orderBy('teacherSchools.startDate', 'desc')
        .execute();

      return currentSchools.map(school => ({
        ...school,
        daysSinceStart: Math.floor(
          (new Date().getTime() - school.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }));
    } catch (error) {
      databaseErrorThrower('Failed to get teacher current schools', error);
    }

    return;
  }
}

export const teacherSchoolService = new TeacherSchoolService();
