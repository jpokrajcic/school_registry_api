import { db } from '../config/database';
import { databaseErrorThrower } from '../middleware/errorHandler';
import {
  type CreateRoleInput,
  type RoleQuery,
  type UpdateRoleInput,
} from '../schemas/roleSchema';
import { type Role, type NewRole, type RoleUpdate } from '../types/database';

export class RoleService {
  async createRole(input: CreateRoleInput): Promise<Role | undefined> {
    try {
      const newRole: NewRole = {
        name: input.name,
        description: input.description ?? '',
      };

      return await db
        .insertInto('roles')
        .values(newRole)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create role', error);
    }
    return;
  }

  async getRoles(
    query: RoleQuery
  ): Promise<{ roles: Role[]; total: number } | undefined> {
    try {
      let dbQuery = db.selectFrom('roles');

      if (query.search) {
        dbQuery = dbQuery.where('name', 'ilike', `%${query.search}%`);
      }

      // Get total count for pagination
      const totalResult = await dbQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Apply pagination and ordering
      const roles = await dbQuery
        .selectAll()
        .orderBy('id', 'asc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { roles, total };
    } catch (error) {
      databaseErrorThrower('Failed to get roles', error);
    }
    return;
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    try {
      return await db
        .selectFrom('roles')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get role', error);
    }
    return;
  }

  async updateRole(
    id: number,
    input: Partial<UpdateRoleInput>
  ): Promise<Role | undefined> {
    try {
      const updateData: RoleUpdate = {
        ...input,
        description: input.description ?? '',
        updated_at: new Date(),
      };

      return await db
        .updateTable('roles')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update role', error);
    }
    return;
  }

  async deleteRole(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('roles')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete role', error);
    }
    return;
  }
}

export const roleService = new RoleService();
