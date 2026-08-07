import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import Banner from '../models/Banner';
import { cloudinary } from '../config/cloudinary';

export const getAllBanners = asyncHandler(async (req: Request, res: Response) => {
  const { position, isActive } = req.query;
  const filter: Record<string, unknown> = {};
  if (position) filter.position = position;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  ApiResponse.success(res, 'Banners retrieved', { banners });
});

export const getBannerById = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return ApiResponse.notFound(res, 'Banner not found');
  ApiResponse.success(res, 'Banner retrieved', { banner });
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const imageFile = files?.image?.[0];
  if (!imageFile) return ApiResponse.badRequest(res, 'Banner image is required');

  const uploadImage = async (file: Express.Multer.File) => {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'rupkatha-sarees/banners',
      transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  };

  const mainImage = await uploadImage(imageFile);
  let mobileImageUrl: string | undefined;

  const mobileFile = files?.mobileImage?.[0];
  if (mobileFile) {
    const mobile = await uploadImage(mobileFile);
    mobileImageUrl = mobile.url;
  }

  const banner = await Banner.create({
    ...req.body,
    image: mainImage.url,
    imagePublicId: mainImage.publicId,
    ...(mobileImageUrl && { mobileImage: mobileImageUrl }),
    sortOrder: Number(req.body.sortOrder) || 0,
    isActive: req.body.isActive !== 'false',
  });

  ApiResponse.created(res, 'Banner created', { banner });
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return ApiResponse.notFound(res, 'Banner not found');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const updates: Record<string, unknown> = { ...req.body };

  const uploadImage = async (file: Express.Multer.File) => {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'rupkatha-sarees/banners',
    });
    return { url: result.secure_url, publicId: result.public_id };
  };

  const imageFile = files?.image?.[0];
  if (imageFile) {
    if (banner.imagePublicId) {
      await cloudinary.uploader.destroy(banner.imagePublicId).catch(() => undefined);
    }
    const mainImage = await uploadImage(imageFile);
    updates.image = mainImage.url;
    updates.imagePublicId = mainImage.publicId;
  }

  const mobileFile = files?.mobileImage?.[0];
  if (mobileFile) {
    const mobile = await uploadImage(mobileFile);
    updates.mobileImage = mobile.url;
  }

  if (updates.sortOrder !== undefined) updates.sortOrder = Number(updates.sortOrder);
  if (updates.isActive !== undefined) updates.isActive = updates.isActive === 'true' || updates.isActive === true;

  const updated = await Banner.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  ApiResponse.success(res, 'Banner updated', { banner: updated });
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return ApiResponse.notFound(res, 'Banner not found');

  if (banner.imagePublicId) {
    await cloudinary.uploader.destroy(banner.imagePublicId).catch(() => undefined);
  }
  await Banner.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, 'Banner deleted');
});

// Public — active banners for homepage
export const getActiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const { position = 'hero' } = req.query;
  const now = new Date();

  const banners = await Banner.find({
    isActive: true,
    position,
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $exists: false } },
      { startDate: { $exists: false }, endDate: { $gte: now } },
    ],
  }).sort({ sortOrder: 1 });

  ApiResponse.success(res, 'Active banners retrieved', { banners });
});
