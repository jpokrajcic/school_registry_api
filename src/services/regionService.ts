// regionService.ts
import { db } from '../config/database';
import {
  type CreateRegionInput,
  type RegionQuery,
  type UpdateRegionInput,
} from '../schemas/regionSchema';
import {
  type NewRegion,
  type RegionUpdate,
  type Region,
} from '../types/database';

export class RegionService {
  async createRegion(input: CreateRegionInput): Promise<Region> {
    const newRegion: NewRegion = {
      ...input,
    };

    return await db
      .insertInto('regions')
      .values(newRegion)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getRegions(
    query: RegionQuery
  ): Promise<{ regions: Region[]; total: number }> {
    let dbQuery = db.selectFrom('regions');

    // Apply filters
    if (query.is_city !== undefined) {
      dbQuery = dbQuery.where('is_city', '=', query.is_city);
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
    const regions = await dbQuery
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(query.limit || 10)
      .offset(((query.page || 1) - 1) * (query.limit || 10))
      .execute();

    return { regions, total };
  }

  async getRegionById(id: number): Promise<Region | undefined> {
    return await db
      .selectFrom('regions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async updateRegion(
    id: number,
    input: UpdateRegionInput
  ): Promise<Region | undefined> {
    const updateData: RegionUpdate = {
      ...input,
      updated_at: new Date(),
    };

    return await db
      .updateTable('regions')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async deleteRegion(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('regions')
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const regionService = new RegionService();
