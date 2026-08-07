import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS, UserRole } from '../constants';
import User from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      ApiResponse.unauthorized(res, 'Access token is required');
      return;
    }

    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await User.findById(decoded.id).select('_id email role isActive');
    if (!user || !user.isActive) {
      ApiResponse.unauthorized(res, 'User not found or has been deactivated');
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      ApiResponse.unauthorized(res, 'Access token has expired. Please refresh your token.');
    } else if (err.name === 'JsonWebTokenError') {
      ApiResponse.unauthorized(res, 'Invalid access token');
    } else {
      ApiResponse.error(res, 'Authentication failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};
