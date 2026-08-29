import { Request, Response } from 'express';
import StoreSetting from '../models/StoreSetting';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const defaults = {
  key: 'store',
  storeName: 'PP’s Aura',
  supportEmail: 'support@ppaura.in',
  supportPhone: '',
  storeAddress: '12 Silk Street, Kolkata — 700001, West Bengal',
  freeShippingThreshold: 999,
  standardShippingRate: 99,
  loyaltyPointsRate: 1,
  upiId: '',
  upiPayeeName: 'PP’s Aura',
  socialLinks: {
    instagram: 'https://instagram.com/ppaura',
    facebook: 'https://facebook.com/ppaura',
    twitter: 'https://twitter.com/ppaura',
    youtube: 'https://youtube.com/@ppaura',
    pinterest: 'https://pinterest.com/ppaura',
    whatsapp: '',
  },
};

export const getStoreSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await StoreSetting.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: defaults },
    { new: true, upsert: true, runValidators: true }
  );
  return ApiResponse.success(res, 'Store settings retrieved', { settings });
});

export const updateStoreSettings = asyncHandler(async (req: Request, res: Response) => {
  const stringFields = ['storeName', 'supportEmail', 'supportPhone', 'storeAddress', 'upiId', 'upiPayeeName'] as const;
  const numberFields = ['freeShippingThreshold', 'standardShippingRate', 'loyaltyPointsRate'] as const;
  const update: Record<string, unknown> = {};

  stringFields.forEach((field) => { update[field] = String(req.body[field] ?? '').trim(); });
  numberFields.forEach((field) => { update[field] = Number(req.body[field]); });

  const announcementDateValue = String(req.body.upcomingSareeAnnouncementDate ?? '').trim();
  if (announcementDateValue) {
    const announcementDate = new Date(announcementDateValue);
    if (Number.isNaN(announcementDate.getTime())) {
      return ApiResponse.badRequest(res, 'Please enter a valid upcoming saree launch date');
    }
    update.upcomingSareeAnnouncementDate = announcementDate;
  } else {
    update.upcomingSareeAnnouncementDate = null;
  }

  if (!update.storeName || !/^\S+@\S+\.\S+$/.test(String(update.supportEmail))) {
    return ApiResponse.badRequest(res, 'A store name and valid support email are required');
  }
  if (update.supportPhone && !/^\+?[0-9][0-9\s-]{7,18}$/.test(String(update.supportPhone))) {
    return ApiResponse.badRequest(res, 'Please enter a valid support phone number');
  }
  if (update.upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(String(update.upiId))) {
    return ApiResponse.badRequest(res, 'Please enter a valid business UPI ID');
  }
  if (update.upiId && !update.upiPayeeName) {
    return ApiResponse.badRequest(res, 'UPI payee name is required when a UPI ID is configured');
  }
  if (numberFields.some((field) => !Number.isFinite(update[field]) || Number(update[field]) < 0)) {
    return ApiResponse.badRequest(res, 'Shipping and loyalty values must be valid positive numbers');
  }

  const socialLinks = req.body.socialLinks && typeof req.body.socialLinks === 'object'
    ? Object.fromEntries(Object.entries(req.body.socialLinks).map(([key, value]) => [key, String(value ?? '').trim()]))
    : {};

  const settings = await StoreSetting.findOneAndUpdate(
    { key: 'store' },
    { $set: { ...update, socialLinks }, $setOnInsert: { key: 'store' } },
    { new: true, upsert: true, runValidators: true }
  );
  return ApiResponse.success(res, 'Store settings updated', { settings });
});
