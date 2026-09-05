import { Request, Response } from 'express';
import NewsletterSubscriber from '../models/NewsletterSubscriber';
import { emailService } from '../services/email.service';
import { logger } from '../middlewares/logger.middleware';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribeToNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return ApiResponse.badRequest(res, 'Please enter a valid email address');
  }

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing?.isActive) {
    return ApiResponse.success(res, 'You are already subscribed to our newsletter');
  }

  await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { email, isActive: true, subscribedAt: new Date() },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  emailService.sendNewsletterWelcome(email).catch((error) => {
    logger.error(`Newsletter welcome email failed for ${email}`, error);
  });

  return ApiResponse.created(res, 'Thank you for subscribing to our newsletter');
});

export const getNewsletterSubscribers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const search = String(req.query.search || '').trim();
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = search ? { email: new RegExp(escapedSearch, 'i') } : {};

  const [subscribers, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit),
    NewsletterSubscriber.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Newsletter subscribers retrieved', subscribers, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: skip + limit < total,
    hasPrevPage: page > 1,
  });
});
