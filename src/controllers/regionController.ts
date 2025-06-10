import { z } from 'zod';
import { type Request, type Response } from 'express';
import {
  createRegionSchema,
  regionParamsSchema,
  regionQuerySchema,
  updateRegionSchema,
} from '../schemas/regionSchema';
import { regionService } from '../services/regionService';

export class RegionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createRegionSchema.parse(req.body);
      const region = await regionService.createRegion(validatedData);

      res.status(201).json({
        success: true,
        data: region,
        message: 'Region created successfully',
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

      console.error('Error creating region:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = regionQuerySchema.parse(req.query);
      const { regions, total } = await regionService.getRegions(query);

      const totalPages = Math.ceil(total / (query.limit || 10));

      res.json({
        success: true,
        data: regions,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total,
          totalPages,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        });
        return;
      }

      console.error('Error fetching regions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
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
