import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { databaseErrorThrower } from '../errorHandler';
import {
  SafeUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserQuery,
} from '../schemas/userSchema';
import {
  type NewUser,
  type UserUpdate,
  type SafeUser,
  type User,
} from '../types/database';

export class UserService {
  async createUser(input: CreateUserInput): Promise<SafeUser | undefined> {
    try {
      const hash = await bcrypt.hash(input.password, 12);

      const newUser: NewUser = {
        email: input.email,
        passwordHash: hash, // Make sure to hash password before storing in production!
        roleId: input.roleId,
        schoolId: input.schoolId ?? null,
      };

      const result = await db
        .insertInto('users')
        .values(newUser)
        .returning([
          'id',
          'email',
          'roleId',
          'schoolId',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirstOrThrow();

      return SafeUserSchema.parse(result);
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
      if (query.roleId !== undefined && typeof query.roleId === 'number') {
        baseQuery = baseQuery.where('roleId', '=', query.roleId);
      }

      if (query.schoolId) {
        baseQuery = baseQuery.where('schoolId', '=', query.schoolId);
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
        .select(['id', 'email', 'roleId', 'schoolId', 'createdAt', 'updatedAt'])
        .orderBy('createdAt', 'desc')
        .limit(query.limit || 10)
        .offset(((query.page || 1) - 1) * (query.limit || 10))
        .execute();

      return { users, total };
    } catch (error) {
      databaseErrorThrower('Failed to get users', error);
    }

    return;
  }

  async getUserById(id: number): Promise<SafeUser | undefined> {
    try {
      return await db
        .selectFrom('users')
        .select(['id', 'email', 'roleId', 'schoolId', 'createdAt', 'updatedAt'])
        .where('id', '=', id)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get user', error);
    }

    return;
  }

  async getUserByEmail(email: string): Promise<SafeUser | undefined> {
    try {
      return await db
        .selectFrom('users')
        .select(['id', 'email', 'roleId', 'schoolId', 'createdAt', 'updatedAt'])
        .where('email', '=', email)
        .executeTakeFirst();
    } catch (error) {
      databaseErrorThrower('Failed to get user', error);
    }

    return;
  }

  async getFullUserByEmail(email: string): Promise<User | undefined> {
    try {
      return await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email)
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
        schoolId: input.schoolId === undefined ? null : input.schoolId,
        updatedAt: new Date(),
      };

      const updatedUser = await db
        .updateTable('users')
        .set(updateData)
        .where('id', '=', id)
        .returning([
          'id',
          'email',
          'roleId',
          'schoolId',
          'createdAt',
          'updatedAt',
        ])
        .executeTakeFirst();

      return updatedUser;
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
