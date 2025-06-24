import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import logger from '../logger';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  logger.error(`Error ${statusCode}: ${message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
};

export const handleValidationError = (
  action: string,
  result: z.SafeParseReturnType<any, any>,
  res: Response
): boolean => {
  if (!result.success) {
    const firstErrorMessage =
      result.error.errors && result.error.errors[0]?.message
        ? `${action} ${result.error.errors[0].path[0]} ${action} ${result.error.errors[0].message}`
        : 'Unknown validation error';
    logger.error(`Validation error 400: ${firstErrorMessage}`);
    console.error('Validation error:', result.error.errors);
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: result.error.errors,
    });
    return true;
  }
  return false;
};

export const handleDatabaseError = (
  res: Response,
  error: unknown,
  message: string
): void => {
  logger.error(`Error 500: ${message}`);
  console.error(`${message}:`, error);

  res.status(500).json({
    success: false,
    message,
  });
};

export const databaseErrorThrower = (
  message: string,
  error: unknown
): never => {
  if (error instanceof Error) {
    error.message = `${message}: ${error}`;
    throw error;
  }

  throw new Error(`${message}: Unknown error`);
};
