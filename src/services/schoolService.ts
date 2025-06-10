import { db } from '../config/database';
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
  async createSchool(input: CreateSchoolInput): Promise<School> {
    const newSchool: NewSchool = {
      ...input,
    };

    return await db
      .insertInto('schools')
      .values(newSchool)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getSchools(
    query: SchoolQuery
  ): Promise<{ schools: School[]; total: number }> {
    let dbQuery = db.selectFrom('schools');

    // Apply filters
    if (
      query.ownership_type !== undefined &&
      Object.values(OwnershipType).includes(
        query.ownership_type as OwnershipType
      )
    ) {
      dbQuery = dbQuery.where(
        'ownership_type',
        '=',
        query.ownership_type as OwnershipType
      );
    }

    if (query.region_id) {
      dbQuery = dbQuery.where('region_id', '=', query.region_id);
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
      .orderBy('created_at', 'desc')
      .limit(query.limit || 10)
      .offset(((query.page || 1) - 1) * (query.limit || 10))
      .execute();

    return { schools, total };
  }

  async getSchoolById(id: number): Promise<SchoolParams | undefined> {
    return await db
      .selectFrom('schools')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async updateSchool(
    id: number,
    input: UpdateSchoolInput
  ): Promise<School | undefined> {
    const updateData: SchoolUpdate = {
      ...input,
      updated_at: new Date(),
    };

    return await db
      .updateTable('schools')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('schools')
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const schoolService = new SchoolService();
