import { z } from 'zod';
import { query, type Request, type Response } from 'express';
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
    try {
      const { id } = regionParamsSchema.parse(req.params);
      const region = await regionService.getRegionById(id);

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
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid region ID',
        });
        return;
      }

      console.error('Error fetching region:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = regionParamsSchema.parse(req.params);
      const validatedData = updateRegionSchema.parse(req.body);

      const region = await regionService.updateRegion(id, validatedData);

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
        message: 'Region updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      console.error('Error updating region:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = regionParamsSchema.parse(req.params);
      const deleted = await regionService.deleteRegion(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Region not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Region deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting region:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const regionController = new RegionController();
