import { userRepository } from '../repositories/user.repository';
import { generateTokenPair, generateRandomToken, generateHashedToken } from '../utils/generateToken';
import { sendEmail } from '../config/email';
import { getWelcomeEmailTemplate, getPasswordResetEmailTemplate } from './email.service';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS, UserRole, LOYALTY } from '../constants';
import { IUser, TokenPair } from '../interfaces';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: IUser; tokens: TokenPair }> {
    const { name, email, password, phone, referralCode } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new CustomError('Email is already registered', HTTP_STATUS.CONFLICT);
    }

    // Find referrer if code provided
    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await userRepository.findByReferralCode(referralCode);
      if (referrer) {
        referrerId = referrer._id.toString();
      }
    }

    // Create user
    const user = await userRepository.create({
      name,
      email,
      password,
      phone,
      role: UserRole.CUSTOMER,
      loyaltyPoints: LOYALTY.WELCOME_BONUS,
      ...(referrerId && { referredBy: referrerId as unknown as import('mongoose').Types.ObjectId }),
    });

    // Give referral points to both users
    if (referrerId) {
      await userRepository.updateLoyaltyPoints(referrerId, LOYALTY.REFERRAL_BONUS);
      await userRepository.updateLoyaltyPoints(user._id.toString(), LOYALTY.REFERRAL_FRIEND_BONUS);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await userRepository.updateById(user._id.toString(), { refreshToken: tokens.refreshToken });

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: `Welcome to PP’s Aura, ${user.name}! 🥻`,
      html: getWelcomeEmailTemplate(user.name, LOYALTY.WELCOME_BONUS),
    }).catch(console.error);

    return { user, tokens };
  }

  async login(data: LoginData): Promise<{ user: IUser; tokens: TokenPair }> {
    const { email, password } = data;

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new CustomError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new CustomError('Your account has been deactivated. Please contact support.', HTTP_STATUS.FORBIDDEN);
    }

    if (!user.password) {
      // Do not reveal whether an account exists or which sign-in method it uses.
      throw new CustomError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new CustomError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update refresh token and last login
    await userRepository.updateById(user._id.toString(), {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    });

    return { user, tokens };
  }

  async logout(userId: string): Promise<void> {
    await userRepository.updateById(userId, { refreshToken: undefined });
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const user = await userRepository.findByRefreshToken(refreshToken);
    if (!user) {
      throw new CustomError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = generateTokenPair({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await userRepository.updateById(user._id.toString(), {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password — PP’s Aura',
      html: getPasswordResetEmailTemplate(user.name, resetUrl),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = generateHashedToken(token);
    const user = await userRepository.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new CustomError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new CustomError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new CustomError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new CustomError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }
}

export const authService = new AuthService();
