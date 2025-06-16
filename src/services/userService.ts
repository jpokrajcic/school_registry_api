import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { databaseErrorThrower } from '../middleware/errorHandler';
import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserParams,
  type UserQuery,
} from '../schemas/userSchema';
import {
  type NewUser,
  type UserUpdate,
  type SafeUser,
} from '../types/database';

export class UserService {
  async createUser(input: CreateUserInput): Promise<SafeUser | undefined> {
    try {
      const hash = await bcrypt.hash(input.password, 12);

      const newUser: NewUser = {
        email: input.email,
        password_hash: hash, // Make suxre to hash password before storing in production!
        role_id: input.role_id,
        school_id: input.school_id ?? null,
      };

      return await db
        .insertInto('users')
        .values(newUser)
        .returning([
          'id',
          'email',
          'role_id',
          'school_id',
          'created_at',
          'updated_at',
        ]) // select only safe fields
        .executeTakeFirstOrThrow();
    } catch (error) {
      databaseErrorThrower('Failed to create user', error);
    }

    return;
  }

  async getUsers(
    query: UserQuery
  ): Promise<{ users: SafeUser[]; total: number } | undefined> {
    try {
      // Build base query for filtering
      let baseQuery = db.selectFrom('users');

      // Apply filters
      if (query.role_id !== undefined && typeof query.role_id === 'number') {
        baseQuery = baseQuery.where('role_id', '=', query.role_id);
      }

      if (query.school_id) {
        baseQuery = baseQuery.where('school_id', '=', query.school_id);
      }

      if (query.search) {
        baseQuery = baseQuery.where('email', 'ilike', `%${query.search}%`);
      }

      // Get total count
      const totalResult = await baseQuery
        .select(eb => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      const total = Number(totalResult?.count || 0);

      // Get users with pagination
      const users = await baseQuery
        .select([
          'id',
          'email',
          'role_id',
          'school_id',
          'created_at',
          'updated_at',
        ])
        .orderBy('created_at', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { users, total };
    } catch (error) {
      databaseErrorThrower('Failed to get users', error);
    }

    return;
  }

  async getUserById(id: number): Promise<UserParams | undefined> {
    try {
      return await db
        .selectFrom('users')
        .select([
          'id',
          'email',
          'role_id',
          'school_id',
          'created_at',
          'updated_at',
        ])
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get user', error);
    }

    return;
  }

  async updateUser(
    id: number,
    input: Partial<UpdateUserInput>
  ): Promise<SafeUser | undefined> {
    try {
      const updateData: UserUpdate = {
        ...input,
        school_id: input.school_id === undefined ? null : input.school_id,
        updated_at: new Date(),
      };

      return await db
        .updateTable('users')
        .set(updateData)
        .where('id', '=', id)
        .returning([
          'id',
          'email',
          'role_id',
          'school_id',
          'created_at',
          'updated_at',
        ])
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to update user', error);
    }

    return;
  }

  async deleteUser(id: number): Promise<boolean | undefined> {
    try {
      const result = await db
        .deleteFrom('users')
        .where('id', '=', id)
        .executeTakeFirst();

      return Number(result.numDeletedRows) > 0;
    } catch (error) {
      databaseErrorThrower('Failed to delete user', error);
    }

    return;
  }
}

export const userService = new UserService();
