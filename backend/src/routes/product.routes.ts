import { Router } from 'express';
import {
  getAllProducts,
  searchProducts,
  getProductBySlug,
  getProductById,
  getProductByIdForAdmin,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getProductDashboardStats,
  getAllProductsForAdmin,
  cloneProduct,
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
router.get('/admin/stats', authenticate, requireAdmin, getProductDashboardStats);
router.get('/admin/all', authenticate, requireAdmin, getAllProductsForAdmin);
router.get('/admin/:id', authenticate, requireAdmin, getProductByIdForAdmin);
router.get('/:slug', getProductBySlug);
router.get('/id/:id', getProductById);
router.get('/:productId/related/:categoryId', getRelatedProducts);

// Admin routes
router.use(authenticate, requireAdmin);
router.post('/', uploadMultiple, createProduct);
router.post('/:id/clone', cloneProduct);
router.put('/:id', uploadMultiple, updateProduct);
router.delete('/:id', deleteProduct);
router.delete('/:id/images/:publicId', deleteProductImage);

export default router;
