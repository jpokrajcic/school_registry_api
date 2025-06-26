import { type Request, type Response } from 'express';
import {
  createUserSchema,
  userParamsSchema,
  userQuerySchema,
  userUpdateSchema,
} from '../schemas/userSchema';
import { userService } from '../services/userService';
import { handleValidationError, handleError } from '../errorHandler';

export class UserController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createUserSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE USER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const user = await userService.createUser(validationResult.data);

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User could not be created',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: user,
          message: 'User created successfully',
        });
      } catch (error) {
        handleError('Failed to create user', error, res);
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await userQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET USERS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await userService.getUsers(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No users found',
          });
          return;
        }

        const { users, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleError('Failed to fetch users', error, res);
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = await userParamsSchema.safeParseAsync(req.params);

    if (handleValidationError('GET USER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const user = await userService.getUserById(validationResult.data.id);

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        res.json({
          success: true,
          data: user,
        });
      } catch (error) {
        handleError('Failed to fetch user', error, res);
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await userParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await userUpdateSchema.safeParse(req.body);

    if (
      handleValidationError('UPDATE USER', paramsValidationResult, res) ||
      handleValidationError('UPDATE USER', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const user = await userService.updateUser(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: user,
          message: 'User updated successfully',
        });
      } catch (error) {
        handleError('Failed to update user', error, res);
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await userParamsSchema.safeParseAsync(req.params);

    if (handleValidationError('DELETE USER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await userService.deleteUser(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'User deleted successfully',
        });
      } catch (error) {
        handleError('Failed to delete user', error, res);
      }
    }
  }
}

export const userController = new UserController();
