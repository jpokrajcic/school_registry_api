import { db } from '../config/database';
import { databaseErrorThrower } from '../errorHandler';
import {
  type CreateStudentInput,
  type UpdateStudentInput,
  type StudentQuery,
  type BulkCreateStudentsInput,
  type TransferStudentInput,
} from '../schemas/studentSchema';
import {
  type Student,
  type NewStudent,
  type StudentUpdate,
  Gender,
} from '../types/database';

export class StudentService {
  async createStudent(input: CreateStudentInput): Promise<Student | undefined> {
    try {
      const newStudent: NewStudent = {
        firstName: input.firstName,
        middleName: input.middleName || '',
        lastName: input.lastName,
        regionId: input.regionId,
        postCode: input.postCode,
        address: input.address,
        phone: input.phone || null,
        email: input.email || null,
        mobile: input.mobile || null,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth || null,
        studentNumber: input.studentNumber,
        schoolId: input.schoolId || null,
        enrollmentDate: input.enrollmentDate || null,
        active: input.active ?? true,
      };

      return await db
        .insertInto('students')
        .values(newStudent)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create student', error);
    }

    return;
  }

  async createStudents(
    input: BulkCreateStudentsInput
  ): Promise<Student[] | undefined> {
    try {
      return await db.transaction().execute(async trx => {
        const newStudents: NewStudent[] = input.students.map(student => ({
          firstName: student.firstName,
          middleName: student.middleName || '',
          lastName: student.lastName,
          regionId: student.regionId,
          postCode: student.postCode,
          address: student.address,
          phone: student.phone || null,
          email: student.email || null,
          mobile: student.mobile || null,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth || null,
          studentNumber: student.studentNumber,
          schoolId: student.schoolId || null,
          enrollmentDate: student.enrollmentDate || null,
          active: student.active ?? true,
        }));

        // Insert all students in one operation
        return await trx
          .insertInto('students')
          .values(newStudents)
          .returningAll()
          .execute();
      });
    } catch (error) {
      databaseErrorThrower('Failed to create students', error);
    }

    return;
  }

  async getStudents(
    query: StudentQuery
  ): Promise<{ students: Student[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('students');

      // Apply filters
      if (query.regionId) {
        dbQuery = dbQuery.where('regionId', '=', query.regionId);
      }

      if (query.schoolId) {
        dbQuery = dbQuery.where('schoolId', '=', query.schoolId);
      }

      if (query.gender) {
        dbQuery = dbQuery.where('gender', '=', query.gender as Gender);
      }

      if (query.active !== undefined) {
        dbQuery = dbQuery.where('active', '=', query.active);
      }

      if (query.ageRange) {
        const currentDate = new Date();
        const minBirthDate = new Date(
          currentDate.getFullYear() - query.ageRange.max,
          currentDate.getMonth(),
          currentDate.getDate()
        );
        const maxBirthDate = new Date(
          currentDate.getFullYear() - query.ageRange.min,
          currentDate.getMonth(),
          currentDate.getDate()
        );

        dbQuery = dbQuery
          .where('dateOfBirth', '>=', minBirthDate)
          .where('dateOfBirth', '<=', maxBirthDate);
      }

      if (query.search) {
        dbQuery = dbQuery.where(eb =>
          eb.or([
            eb('firstName', 'ilike', `%${query.search}%`),
            eb('lastName', 'ilike', `%${query.search}%`),
            eb('middleName', 'ilike', `%${query.search}%`),
            eb('studentNumber', 'ilike', `%${query.search}%`),
            eb('email', 'ilike', `%${query.search}%`),
          ])
        );
      }

      // Get total count for pagination
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Apply sorting
      const sortBy = query.sortBy || 'lastName';
      const sortOrder = query.sortOrder || 'asc';

      // Apply pagination and ordering
      const students = await dbQuery
        .selectAll()
        .orderBy(sortBy, sortOrder)
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { students, total };
    } catch (error) {
      databaseErrorThrower('Failed to get students', error);
    }

    return;
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    try {
      return await db
        .selectFrom('students')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get student', error);
    }

    return;
  }

  async updateStudent(
    id: number,
    input: UpdateStudentInput
  ): Promise<Student | undefined> {
    try {
      const updateData: StudentUpdate = {
        ...input,
        middleName: input.middleName ?? '',
        phone: input.phone !== undefined ? input.phone : null,
        email: input.email !== undefined ? input.email : null,
        mobile: input.mobile !== undefined ? input.mobile : null,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('students')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update student', error);
    }

    return;
  }

  async deleteStudent(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('students')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete student', error);
    }

    return;
  }

  async softDeleteStudent(id: number): Promise<Student | undefined> {
    try {
      return await db
        .updateTable('students')
        .set({ active: false, updatedAt: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to deactivate student', error);
    }

    return;
  }

  async reactivateStudent(id: number): Promise<Student | undefined> {
    try {
      return await db
        .updateTable('students')
        .set({ active: true, updatedAt: new Date() })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to reactivate student', error);
    }

    return;
  }

  async transferStudent(
    id: number,
    input: TransferStudentInput
  ): Promise<Student | undefined> {
    try {
      const updateData: StudentUpdate = {
        schoolId: input.newSchoolId || null,
        regionId: input.newRegionId || null,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('students')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to transfer student', error);
    }

    return;
  }

  async getStudentStatistics(): Promise<
    | {
        total: number;
        active: number;
        inactive: number;
        byGender: { male: number; female: number };
        byRegion: Array<{ regionId: number; count: number }>;
        bySchool: Array<{ schoolId: number; count: number }>;
      }
    | undefined
  > {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        genderResults,
        regionResults,
        schoolResults,
      ] = await Promise.all([
        // Total students
        db
          .selectFrom('students')
          .select(eb => eb.fn.countAll().as('count'))
          .executeTakeFirst(),

        // Active students
        db
          .selectFrom('students')
          .select(eb => eb.fn.countAll().as('count'))
          .where('active', '=', true)
          .executeTakeFirst(),

        // Inactive students
        db
          .selectFrom('students')
          .select(eb => eb.fn.countAll().as('count'))
          .where('active', '=', false)
          .executeTakeFirst(),

        // By gender
        db
          .selectFrom('students')
          .select(['gender', eb => eb.fn.countAll().as('count')])
          .where('active', '=', true)
          .groupBy('gender')
          .execute(),

        // By region
        db
          .selectFrom('students')
          .select(['regionId', eb => eb.fn.countAll().as('count')])
          .where('active', '=', true)
          .groupBy('regionId')
          .execute(),

        // By school
        db
          .selectFrom('students')
          .select(['schoolId', eb => eb.fn.countAll().as('count')])
          .where('active', '=', true)
          .where('schoolId', 'is not', null)
          .groupBy('schoolId')
          .execute(),
      ]);

      const byGender = {
        male: Number(genderResults.find(r => r.gender === 'male')?.count || 0),
        female: Number(
          genderResults.find(r => r.gender === 'female')?.count || 0
        ),
      };

      const byRegion = regionResults
        .filter(r => r.regionId !== null)
        .map(r => ({
          regionId: r.regionId as number,
          count: Number(r.count),
        }));

      const bySchool = schoolResults.map(r => ({
        schoolId: r.schoolId!,
        count: Number(r.count),
      }));

      return {
        total: Number(totalResult?.count || 0),
        active: Number(activeResult?.count || 0),
        inactive: Number(inactiveResult?.count || 0),
        byGender,
        byRegion,
        bySchool,
      };
    } catch (error) {
      databaseErrorThrower('Failed to get student statistics', error);
    }

    return;
  }
}

export const studentService = new StudentService();
