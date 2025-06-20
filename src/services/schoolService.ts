import { db } from '../config/database';
import { databaseErrorThrower } from '../middleware/errorHandler';
import {
  type CreateSchoolInput,
  type SchoolParams,
  type SchoolQuery,
  // type SchoolQuery,
  type UpdateSchoolInput,
} from '../schemas/schoolSchema';
import {
  OwnershipType,
  type School,
  type NewSchool,
  type SchoolUpdate,
} from '../types/database';

export class SchoolService {
  async createSchool(input: CreateSchoolInput): Promise<School | undefined> {
    try {
      const newSchool: NewSchool = {
        ...input,
      };

      return await db
        .insertInto('schools')
        .values(newSchool)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create school', error);
    }

    return;
  }

  async getSchools(
    query: SchoolQuery
  ): Promise<{ schools: School[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('schools');

      // Apply filters
      if (
        query.ownershipType !== undefined &&
        Object.values(OwnershipType).includes(
          query.ownershipType as OwnershipType
        )
      ) {
        dbQuery = dbQuery.where(
          'ownershipType',
          '=',
          query.ownershipType as OwnershipType
        );
      }

      if (query.regionId) {
        dbQuery = dbQuery.where('regionId', '=', query.regionId);
      }

      if (query.search) {
        dbQuery = dbQuery.where('name', 'ilike', `%${query.search}%`);
      }

      // Get total count for pagination
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Apply pagination and ordering
      const schools = await dbQuery
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { schools, total };
    } catch (error) {
      databaseErrorThrower('Failed to get schools', error);
    }

    return;
  }

  async getSchoolById(id: number): Promise<SchoolParams | undefined> {
    try {
      return await db
        .selectFrom('schools')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get school', error);
    }

    return;
  }

  async updateSchool(
    id: number,
    input: UpdateSchoolInput
  ): Promise<School | undefined> {
    try {
      const updateData: SchoolUpdate = {
        ...input,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('schools')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update school', error);
    }

    return;
  }

  async deleteSchool(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('schools')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete school', error);
    }

    return;
  }
}

export const schoolService = new SchoolService();
