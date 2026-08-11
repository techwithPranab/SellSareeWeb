import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CustomError } from './error.middleware';
import { FILE_UPLOAD, HTTP_STATUS } from '../constants';

// Memory storage for Cloudinary upload
const memoryStorage = multer.memoryStorage();

// Disk storage for local uploads
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      )
    );
  }
};

const videoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (FILE_UPLOAD.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError('Invalid video type. Only MP4 and WebM are allowed', HTTP_STATUS.BAD_REQUEST));
  }
};

// Multer instances
export const uploadSingle = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: 1,
  },
}).single('image');

export const uploadMultiple = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT,
  },
}).array('images', FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT);

export const uploadProductImages = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT,
  },
}).fields([
  { name: 'images', maxCount: FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT },
  { name: 'video', maxCount: 1 },
]);

export const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
    files: 1,
  },
}).single('avatar');

export const uploadPaymentScreenshot = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
}).single('paymentScreenshot');

export const uploadBannerImage = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: 2,
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]);

// Local disk upload (for development/backup)
export const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
  },
});
