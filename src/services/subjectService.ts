import { db } from '../config/database';
import { databaseErrorThrower } from '../errorHandler';
import {
  type CreateSubjectInput,
  type SubjectQuery,
  type UpdateSubjectInput,
} from '../schemas/subjectSchema';
import {
  type Subject,
  type NewSubject,
  type SubjectUpdate,
} from '../types/database';

export class SubjectService {
  async createSubject(input: CreateSubjectInput): Promise<Subject | undefined> {
    try {
      const newSubject: NewSubject = {
        ...input,
      };

      return await db
        .insertInto('subjects')
        .values(newSubject)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create subject', error);
    }
    return;
  }

  async getSubjects(
    query: SubjectQuery
  ): Promise<{ subjects: Subject[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('subjects');

      // Apply filters
      if (query.search) {
        dbQuery = dbQuery.where(eb =>
          eb.or([
            eb('name', 'ilike', `%${query.search}%`),
            eb('description', 'ilike', `%${query.search}%`),
          ])
        );
      }

      if (query.code) {
        dbQuery = dbQuery.where('code', '=', query.code);
      }

      // Get total count for pagination
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Apply pagination and ordering
      const subjects = await dbQuery
        .selectAll()
        .orderBy('name', 'asc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { subjects, total };
    } catch (error) {
      databaseErrorThrower('Failed to get subjects', error);
    }
    return;
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    try {
      return await db
        .selectFrom('subjects')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get subject', error);
    }
    return;
  }

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    try {
      return await db
        .selectFrom('subjects')
        .selectAll()
        .where('code', '=', code)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get subject by code', error);
    }
    return;
  }

  async updateSubject(
    id: number,
    input: Partial<UpdateSubjectInput>
  ): Promise<Subject | undefined> {
    try {
      const updateData: SubjectUpdate = {
        ...input,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('subjects')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update subject', error);
    }
    return;
  }

  async deleteSubject(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('subjects')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete subject', error);
    }
    return;
  }
}

export const subjectService = new SubjectService();
