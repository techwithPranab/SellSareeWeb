import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { UserRole } from '../constants';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      ApiResponse.forbidden(
        res,
        `Access denied. Required roles: ${roles.join(', ')}`
      );
      return;
    }

    next();
  };

export const requireAdmin = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requireSuperAdmin = authorize(UserRole.SUPER_ADMIN);
export const requireCustomer = authorize(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN);

export const requireSelfOrAdmin = (userIdParamName = 'id') =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const paramUserId = req.params[userIdParamName];
    const isOwner = req.user.id === paramUserId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as UserRole);

    if (!isOwner && !isAdmin) {
      ApiResponse.forbidden(res, 'Access denied. You can only access your own resources.');
      return;
    }

    next();
  };
