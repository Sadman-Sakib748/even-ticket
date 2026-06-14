import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // AppError (custom error)
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.message, error);
    return;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    sendError(res, 400, 'Validation failed', error, error.errors);
    return;
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    sendError(res, 400, 'Validation failed', error, errors);
    return;
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    sendError(res, 409, `Duplicate value for ${field}. Please use another value.`, error);
    return;
  }

  // JWT error
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 401, 'Invalid token. Please login again.', error);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 401, 'Token expired. Please login again.', error);
    return;
  }

  // Default error
  console.error('Unhandled error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  sendError(res, statusCode, message, error);
};