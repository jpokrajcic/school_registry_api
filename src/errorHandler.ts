import { z } from 'zod';
import { type Response } from 'express';
import logger from './logger';

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

export const handleError = (
  message: string,
  error?: unknown,
  res?: Response
): void => {
  logger.error(`Error 500: ${message} ${error ? error : ''}`);
  console.error(`${message}:`, error);

  if (res) {
    res.status(500).json({
      success: false,
      message,
    });
  }
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
