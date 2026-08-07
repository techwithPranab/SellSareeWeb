import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { body } from 'express-validator';
import { validateRequest } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must have at least 8 chars with uppercase, lowercase & number'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
    validateRequest,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login
);

router.post('/refresh-token', refreshToken);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    validateRequest,
  ],
  forgotPassword
);

router.put(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must meet complexity requirements'),
    validateRequest,
  ],
  resetPassword
);

// Protected routes
router.use(authenticate);

router.post('/logout', logout);
router.get('/me', getMe);
router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must meet complexity requirements'),
    validateRequest,
  ],
  changePassword
);

export default router;
