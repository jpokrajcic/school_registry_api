import { db } from '../config/database';
import { databaseErrorThrower } from '../errorHandler';
import {
  type CreateTeacherInput,
  type UpdateTeacherInput,
  type TeacherQuery,
  type BulkCreateTeachersInput,
} from '../schemas/teacherSchema';
import {
  type Teacher,
  type NewTeacher,
  type TeacherUpdate,
  Gender,
} from '../types/database';

export class TeacherService {
  async createTeacher(input: CreateTeacherInput): Promise<Teacher | undefined> {
    try {
      const newTeacher: NewTeacher = {
        firstName: input.firstName,
        middleName: input.middleName || '',
        lastName: input.lastName,
        postCode: input.postCode,
        address: input.address,
        email: input.email,
        phone: input.phone || null,
        mobile: input.mobile || null,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth || null,
      };

      return await db
        .insertInto('teachers')
        .values(newTeacher)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create teacher', error);
    }

    return;
  }

  async createTeachers(
    input: BulkCreateTeachersInput
  ): Promise<Teacher[] | undefined> {
    try {
      return await db.transaction().execute(async trx => {
        const newTeachers: NewTeacher[] = input.teachers.map(teacher => ({
          firstName: teacher.firstName,
          middleName: teacher.middleName || '',
          lastName: teacher.lastName,
          postCode: teacher.postCode,
          address: teacher.address,
          email: teacher.email,
          phone: teacher.phone || null,
          mobile: teacher.mobile || null,
          gender: teacher.gender,
          dateOfBirth: teacher.dateOfBirth || null,
        }));

        // Insert all teachers in one operation
        return await trx
          .insertInto('teachers')
          .values(newTeachers)
          .returningAll()
          .execute();
      });
    } catch (error) {
      databaseErrorThrower('Failed to create teachers', error);
    }

    return;
  }

  async getTeachers(
    query: TeacherQuery
  ): Promise<{ teachers: Teacher[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('teachers');

      // Apply filters
      if (query.gender) {
        dbQuery = dbQuery.where('gender', '=', query.gender as Gender);
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
      const teachers = await dbQuery
        .selectAll()
        .orderBy(sortBy, sortOrder)
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { teachers, total };
    } catch (error) {
      databaseErrorThrower('Failed to get teachers', error);
    }

    return;
  }

  async getTeacherById(id: number): Promise<Teacher | undefined> {
    try {
      return await db
        .selectFrom('teachers')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get teacher', error);
    }

    return;
  }

  async updateTeacher(
    id: number,
    input: UpdateTeacherInput
  ): Promise<Teacher | undefined> {
    try {
      const updateData: TeacherUpdate = {
        ...input,
        middleName: input.middleName ?? '',
        phone: input.phone !== undefined ? input.phone : null,
        mobile: input.mobile !== undefined ? input.mobile : null,
        dateOfBirth: input.dateOfBirth ?? null,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('teachers')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update teacher', error);
    }

    return;
  }
  async deleteTeacher(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('teachers')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete teacher', error);
    }

    return;
  }
}

export const teacherService = new TeacherService();
