import { type Request, type Response } from 'express';
import {
  createSchoolSchema,
  schoolParamsSchema,
  schoolQuerySchema,
  schoolUpdateSchema,
} from '../schemas/schoolSchema';
import { schoolService } from '../services/schoolService';
import {
  handleValidationError,
  handleDatabaseError,
} from '../middleware/errorHandler';

export class SchoolController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createSchoolSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const school = await schoolService.createSchool(validationResult.data);

        if (!school) {
          res.status(404).json({
            success: false,
            message: 'Schoold could not be created',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: school,
          message: 'School created successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to create school');
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET SCHOOLS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await schoolService.getSchools(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No schools found',
          });
          return;
        }

        const { schools, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: schools,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch schools');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('GET SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const school = await schoolService.getSchoolById(
          validationResult.data.id
        );

        if (!school) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.json({
          success: true,
          data: school,
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch school');
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await schoolUpdateSchema.safeParseAsync(
      req.body
    );

    if (
      handleValidationError('UPDATE SCHOOL', paramsValidationResult, res) ||
      handleValidationError('UPDATE SCHOOL', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const school = await schoolService.updateSchool(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!school) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: school,
          message: 'School updated successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to update school');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await schoolParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('DELETE SCHOOL', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await schoolService.deleteSchool(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'School not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'School deleted successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to delete school');
      }
    }
  }
}

export const schoolController = new SchoolController();
