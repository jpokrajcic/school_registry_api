// regionService.ts
import { db } from '../config/database';
import { databaseErrorThrower } from '../middleware/errorHandler';
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
  async createRegion(input: CreateRegionInput): Promise<Region | undefined> {
    try {
      const newRegion: NewRegion = {
        name: input.name,
        isCity: input.isCity,
      };

      return await db
        .insertInto('regions')
        .values(newRegion)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      // Handle unique constraint violation
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'constraint' in error &&
        (error as any).code === '23505' &&
        (error as any).constraint === 'regions_name_unique'
      ) {
        databaseErrorThrower('Region name already exists', error);
      } else {
        databaseErrorThrower('Failed to create region', error);
      }
    }
    return;
  }

  async getRegions(
    query: RegionQuery
  ): Promise<{ regions: Region[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('regions');

      // Apply filters
      if (query.isCity !== undefined) {
        dbQuery = dbQuery.where('isCity', '=', query.isCity);
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
        .orderBy('createdAt', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { regions, total };
    } catch (error) {
      databaseErrorThrower('Failed to get regions', error);
    }
    return;
  }

  async getRegionById(id: number): Promise<Region | undefined> {
    try {
      return await db
        .selectFrom('regions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get region', error);
    }

    return;
  }

  async updateRegion(
    id: number,
    input: UpdateRegionInput
  ): Promise<Region | undefined> {
    try {
      const updateData: RegionUpdate = {
        ...input,
        updatedAt: new Date(),
      };

      return await db
        .updateTable('regions')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update region', error);
    }

    return;
  }

  async deleteRegion(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('regions')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete region', error);
    }

    return;
  }
}

export const regionService = new RegionService();
