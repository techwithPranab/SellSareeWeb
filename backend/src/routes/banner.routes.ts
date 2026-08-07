import { Router } from 'express';
import {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getActiveBanners,
} from '../controllers/banner.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadBannerImage } from '../middlewares/upload.middleware';

const router = Router();

// Public
router.get('/active', getActiveBanners);

// Admin
router.use(authenticate, requireAdmin);
router.get('/', getAllBanners);
router.get('/:id', getBannerById);
router.post('/', uploadBannerImage, createBanner);
router.put('/:id', uploadBannerImage, updateBanner);
router.delete('/:id', deleteBanner);

export default router;
