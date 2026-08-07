import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/apiResponse';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
    }));

    ApiResponse.badRequest(res, 'Validation failed', formattedErrors);
    return;
  }

  next();
};
