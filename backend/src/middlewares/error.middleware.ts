import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.middleware';
import { HTTP_STATUS } from '../constants';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: unknown[];
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  errors?: unknown[];

  constructor(message: string, statusCode = 500, errors?: unknown[]) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors: unknown[] | undefined = err.errors;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path} - ${statusCode}: ${message}`, {
      stack: err.stack,
      body: req.body,
      user: req.user?.id,
    });
  } else {
    logger.warn(`${req.method} ${req.path} - ${statusCode}: ${message}`);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors = Object.values((err as any).errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message = `Invalid ${(err as any).path}: ${(err as any).value}`;
  }

  // Mongoose Duplicate Key Error
  if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = HTTP_STATUS.CONFLICT;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const field = Object.keys((err as any).keyValue || {})[0];
    message = `${field} already exists`;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token has expired';
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Maximum allowed is 5MB';
    } else if (multerErr.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else {
      message = multerErr.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
