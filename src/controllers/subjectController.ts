import { type Request, type Response } from 'express';
import {
  createSubjectSchema,
  subjectParamsSchema,
  subjectQuerySchema,
} from '../schemas/subjectSchema';
import { subjectService } from '../services/subjectService';
import { handleValidationError, handleError } from '../errorHandler';

export class SubjectController {
  async create(req: Request, res: Response): Promise<void> {
    const validationResult = await createSubjectSchema.safeParseAsync(req.body);

    if (handleValidationError('CREATE SUBJECT', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const subject = await subjectService.createSubject(
          validationResult.data
        );

        if (!subject) {
          res.status(404).json({
            success: false,
            message: 'Subject could not be created',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: subject,
          message: 'Subject created successfully',
        });
      } catch (error) {
        handleError('Failed to create subject', error, res);
      }
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const validationResult = await subjectQuerySchema.safeParseAsync(req.query);

    if (handleValidationError('GET SUBJECTS', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const result = await subjectService.getSubjects(validationResult.data);

        if (!result) {
          res.status(404).json({
            success: false,
            message: 'No subjects found',
          });
          return;
        }

        const { subjects, total } = result;
        const limit = validationResult.data.limit || 10;
        const page = validationResult.data.page || 1;
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
          success: true,
          data: subjects,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleError('Failed to fetch subjects', error, res);
      }
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const validationResult = await subjectParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('GET SUBJECT', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const subject = await subjectService.getSubjectById(
          validationResult.data.id
        );

        if (!subject) {
          res.status(404).json({
            success: false,
            message: 'Subject not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: subject,
        });
      } catch (error) {
        handleError('Failed to fetch subject', error, res);
      }
    }
  }

  async getByCode(req: Request, res: Response): Promise<void> {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Subject code is required',
      });
      return;
    }

    try {
      const subject = await subjectService.getSubjectByCode(code);

      if (!subject) {
        res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      handleError('Failed to fetch subject by code', error, res);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const paramsValidationResult = await subjectParamsSchema.safeParseAsync(
      req.params
    );
    const bodyValidationResult = await createSubjectSchema
      .partial()
      .safeParseAsync(req.body);

    if (
      handleValidationError('UPDATE SUBJECT', paramsValidationResult, res) ||
      handleValidationError('UPDATE SUBJECT', bodyValidationResult, res)
    )
      return;

    if (paramsValidationResult.success && bodyValidationResult.success) {
      try {
        const subject = await subjectService.updateSubject(
          paramsValidationResult.data.id,
          bodyValidationResult.data as any
        );

        if (!subject) {
          res.status(404).json({
            success: false,
            message: 'Subject not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: subject,
          message: 'Subject updated successfully',
        });
      } catch (error) {
        handleError('Failed to update subject', error, res);
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const validationResult = await subjectParamsSchema.safeParseAsync(
      req.params
    );

    if (handleValidationError('DELETE SUBJECT', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const isDeleted = await subjectService.deleteSubject(
          validationResult.data.id
        );

        if (!isDeleted) {
          res.status(404).json({
            success: false,
            message: 'Subject not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: validationResult.data.id,
          message: 'Subject deleted successfully',
        });
      } catch (error) {
        handleError('Failed to delete subject', error, res);
      }
    }
  }
}

export const subjectController = new SubjectController();
