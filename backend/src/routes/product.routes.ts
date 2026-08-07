import { Router } from 'express';
import {
  getAllProducts,
  searchProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getProductDashboardStats,
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadMultiple } from '../middlewares/upload.middleware';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/:slug', getProductBySlug);
router.get('/id/:id', getProductById);
router.get('/:productId/related/:categoryId', getRelatedProducts);

// Admin routes
router.use(authenticate, requireAdmin);
router.get('/admin/stats', getProductDashboardStats);
router.post('/', uploadMultiple, createProduct);
router.put('/:id', uploadMultiple, updateProduct);
router.delete('/:id', deleteProduct);
router.delete('/:id/images/:publicId', deleteProductImage);

export default router;
