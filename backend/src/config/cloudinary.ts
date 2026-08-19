import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../middlewares/logger.middleware';

export const CLOUDINARY_ROOT_FOLDER = 'PPsAura';

export const getCloudinaryProductFolder = (sku?: string): string => {
  const safeSku = String(sku || 'unassigned')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unassigned';

  return `${CLOUDINARY_ROOT_FOLDER}/products/${safeSku}`;
};

export const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('☁️  Cloudinary configured successfully');
};

export const uploadImage = async (
  filePath: string,
  folder = CLOUDINARY_ROOT_FOLDER
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    transformation: [
      { quality: 'auto:best', fetch_format: 'auto' },
      { width: 1200, height: 1200, crop: 'limit' },
    ],
  });

  return { url: result.secure_url, publicId: result.public_id };
};

export const uploadMultipleImages = async (
  filePaths: string[],
  folder = CLOUDINARY_ROOT_FOLDER
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploads = filePaths.map((fp) => uploadImage(fp, folder));
  return Promise.all(uploads);
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const deleteMultipleImages = async (publicIds: string[]): Promise<void> => {
  await Promise.all(publicIds.map((id) => deleteImage(id)));
};

export const generateThumbnail = (url: string, width = 400, height = 400): string => {
  return cloudinary.url(url, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

export { cloudinary };
