import { type Request, type Response } from 'express';
import {
  createRegionSchema,
  regionParamsSchema,
  regionQuerySchema,
  updateRegionSchema,
} from '../schemas/regionSchema';
import { regionService } from '../services/regionService';
import {
  handleDatabaseError,
  handleValidationError,
} from '../middleware/errorHandler';

export class RegionController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createRegionSchema.safeParse(req.body);

    if (handleValidationError('CREATE REGION', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const region = await regionService.createRegion(validationResult.data);

        if (!region) {
          res.status(404).json({
            success: false,
            message: 'Region could not be created',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: region,
          message: 'Region created successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to create region');
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await regionQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET SCHOOLS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await regionService.getRegions(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No regions found',
          });
          return;
        }
        const { regions, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: regions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch regions');
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = regionParamsSchema.safeParse(req.params);

    if (handleValidationError('GET Region', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const region = await regionService.getRegionById(
          validationResult.data.id
        );

        if (!region) {
          res.status(404).json({
            success: false,
            message: 'Region not found',
          });
          return;
        }

        res.json({
          success: true,
          data: region,
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to fetch region');
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await regionParamsSchema.safeParse(
      req.params
    );
    const bodyValidationResult = await updateRegionSchema.safeParse(req.body);

    if (
      handleValidationError('UPDATE REGION', paramsValidationResult, res) ||
      handleValidationError('UPDATE REGION', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const region = await regionService.updateRegion(
          paramsValidationResult.data.id,
          bodyValidationResult.data
        );

        if (!region) {
          res.status(404).json({
            success: false,
            message: 'Region not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: region,
          message: 'Region updated successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to update region');
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await regionParamsSchema.safeParse(req.params);

    if (handleValidationError('DELETE REGION', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await regionService.deleteRegion(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'Region not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'Region deleted successfully',
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to delete region');
      }
    }
  }
}

export const regionController = new RegionController();
