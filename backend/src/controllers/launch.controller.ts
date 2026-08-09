import { Request, Response } from 'express';
import LaunchRegistration from '../models/LaunchRegistration';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,18}$/;

export const registerForLaunch = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();

  if (!name || !email || !phone) {
    return ApiResponse.badRequest(res, 'Name, email, and phone number are required');
  }

  if (name.length > 100 || !EMAIL_PATTERN.test(email) || !PHONE_PATTERN.test(phone)) {
    return ApiResponse.badRequest(res, 'Please enter valid registration details');
  }

  const registration = await LaunchRegistration.findOneAndUpdate(
    { email },
    { name, email, phone },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return ApiResponse.success(
    res,
    'You are registered for the launch day special discount',
    { registration: { name: registration.name, email: registration.email } }
  );
});
