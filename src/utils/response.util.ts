import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
  errors?: any[];
  timestamp: string;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: Error | string | object,
  errors?: any[]
): void => {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      response.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      response.error = error;
    }
  }

  if (errors?.length) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};