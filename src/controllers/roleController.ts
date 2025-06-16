import { type Request, type Response } from 'express';
import {
  createRoleSchema,
  roleParamsSchema,
  roleQuerySchema,
  type UpdateRoleInput,
} from '../schemas/roleSchema';
import { roleService } from '../services/roleService';
import {
  handleValidationError,
  handleDatabaseError,
} from '../middleware/errorHandler';

export class RoleController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createRoleSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE ROLE', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const role = await roleService.createRole(validationResult.data);

        if (!role) {
          res.status(404).json({
            success: false,
            message: 'Role could not be created',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: role,
          message: 'Role created successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to create role');
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await roleQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET ROLES', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await roleService.getRoles(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No roles found',
          });
          return;
        }

        const { roles, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: roles,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch roles');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = await roleParamsSchema.safeParseAsync(req.params);

    if (handleValidationError('GET ROLE', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const role = await roleService.getRoleById(validationResult.data.id);

        if (!role) {
          res.status(404).json({
            success: false,
            message: 'Role not found',
          });
          return;
        }

        res.json({
          success: true,
          data: role,
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch role');
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await roleParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await createRoleSchema
      .partial()
      .safeParseAsync(req.body);

    if (
      handleValidationError('UPDATE ROLE', paramsValidationResult, res) ||
      handleValidationError('UPDATE ROLE', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const role = await roleService.updateRole(
          paramsValidationResult.data.id,
          bodyValidationResult.data as UpdateRoleInput
        );

        if (!role) {
          res.status(404).json({
            success: false,
            message: 'Role not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: role,
          message: 'Role updated successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to update role');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await roleParamsSchema.safeParseAsync(req.params);

    if (handleValidationError('DELETE ROLE', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await roleService.deleteRole(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'Role not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'Role deleted successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to delete role');
      }
    }
  }
}

export const roleController = new RoleController();
