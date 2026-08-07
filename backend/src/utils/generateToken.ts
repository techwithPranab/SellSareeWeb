import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, TokenPair } from '../interfaces';
import { UserRole } from '../constants';

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const generateTokenPair = (payload: {
  id: string;
  email: string;
  role: UserRole;
}): TokenPair => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
});

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
};

export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateHashedToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const generateReferralCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RS${timestamp}${random}`;
};
