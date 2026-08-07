import { Response } from 'express';
import { HTTP_STATUS } from '../constants';

export interface ApiResponseData {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  errors?: unknown[];
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = HTTP_STATUS.OK,
    meta?: Record<string, unknown>
  ): Response {
    const response: ApiResponseData = {
      success: true,
      message,
      ...(data !== undefined && { data }),
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, HTTP_STATUS.CREATED);
  }

  static error(
    res: Response,
    message: string,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: unknown[]
  ): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      ...(errors && errors.length > 0 && { errors }),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, errors?: unknown[]): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, message: string): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static tooManyRequests(res: Response, message = 'Too many requests'): Response {
    return ApiResponse.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  ): Response {
    return ApiResponse.success(res, message, data, HTTP_STATUS.OK, { pagination });
  }
}
