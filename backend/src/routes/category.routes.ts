import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Admin routes
router.use(authenticate, requireAdmin);
router.post('/', uploadSingle, createCategory);
router.put('/:id', uploadSingle, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
