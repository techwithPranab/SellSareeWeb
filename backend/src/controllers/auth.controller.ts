import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { authService } from '../services/auth.service';
import { HTTP_STATUS } from '../constants';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, referralCode } = req.body;
  const { user, tokens } = await authService.register({ name, email, password, phone, referralCode });

  res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

  ApiResponse.created(res, 'Registration successful. Welcome to PP’s Aura!', {
    user,
    tokens,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login({ email, password });

  res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

  ApiResponse.success(res, 'Login successful', { user, tokens });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.id);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  ApiResponse.success(res, 'Logout successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshTokenValue) {
    return ApiResponse.unauthorized(res, 'Refresh token is required');
  }

  const tokens = await authService.refreshTokens(refreshTokenValue);

  res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

  return ApiResponse.success(res, 'Token refreshed', { tokens });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  ApiResponse.success(res, 'If an account with that email exists, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;
  await authService.resetPassword(token, password);
  ApiResponse.success(res, 'Password reset successful. Please login with your new password.');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  ApiResponse.success(res, 'Password changed successfully. Please login again.');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  ApiResponse.success(res, 'User profile retrieved', { user });
});
