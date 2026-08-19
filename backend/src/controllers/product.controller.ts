import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { productService } from '../services/product.service';
import { HTTP_STATUS } from '../constants';
import { CustomError } from '../middlewares/error.middleware';
import type { IProduct } from '../interfaces';
import Category from '../models/Category';
import { Types } from 'mongoose';

const normalizeProductNumbers = (body: Record<string, unknown>): Partial<IProduct> => {
  const normalized = { ...body };

  if (normalized.launchDate === '') {
    normalized.launchDate = null;
  } else if (typeof normalized.launchDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized.launchDate)) {
    // A launch date becomes available at midnight in the store's India timezone.
    normalized.launchDate = new Date(`${normalized.launchDate}T00:00:00+05:30`);
  }

  for (const field of ['isActive', 'isFeatured', 'isNewArrival', 'isBestSeller', 'isBridal', 'isSale'] as const) {
    if (normalized[field] === 'true') normalized[field] = true;
    if (normalized[field] === 'false') normalized[field] = false;
  }

  for (const field of ['price', 'stock', 'discountedPrice', 'salePrice'] as const) {
    const rawValue = normalized[field];

    if ((field === 'salePrice' || field === 'discountedPrice') && (rawValue === undefined || rawValue === null || rawValue === '' || rawValue === 'NaN')) {
      delete normalized[field];
      continue;
    }

    if (rawValue !== undefined) {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        throw new CustomError(`${field} must be a valid number`, HTTP_STATUS.BAD_REQUEST);
      }
      normalized[field] = numericValue;
    }
  }

  return normalized as Partial<IProduct>;
};

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, limit, sortBy, sortOrder, category, minPrice, maxPrice,
    fabric, occasion, color, isNewArrival, isBestSeller, isFeatured, isBridal, tags,
  } = req.query;

  let activeCategoryId: string | undefined;
  if (category) {
    const categoryValue = String(category);
    const activeCategory = Types.ObjectId.isValid(categoryValue)
      ? await Category.findOne({ _id: categoryValue, isActive: true }).select('_id')
      : await Category.findOne({ slug: categoryValue, isActive: true }).select('_id');
    activeCategoryId = activeCategory?._id.toString() ?? '000000000000000000000000';
  }

  const filter = {
    ...(activeCategoryId && { category: activeCategoryId }),
    ...(minPrice && { minPrice: Number(minPrice) }),
    ...(maxPrice && { maxPrice: Number(maxPrice) }),
    ...(fabric && { fabric: fabric as string }),
    ...(occasion && { occasion: occasion as string }),
    ...(color && { color: color as string }),
    ...(isNewArrival === 'true' && { isNewArrival: true }),
    ...(isBestSeller === 'true' && { isBestSeller: true }),
    ...(isFeatured === 'true' && { isFeatured: true }),
    ...(isBridal === 'true' && { isBridal: true }),
    ...(tags && { tags: (tags as string).split(',') }),
  };

  const options = {
    page: Number(page) || 1,
    limit: Number(limit) || 12,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  const { data, meta } = await productService.getAllProducts(filter, options);
  ApiResponse.paginated(res, 'Products retrieved', data, meta);
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, page, limit, ...filterParams } = req.query;

  if (!q) {
    return ApiResponse.badRequest(res, 'Search query is required');
  }

  const options = { page: Number(page) || 1, limit: Number(limit) || 12 };
  const { data, meta } = await productService.searchProducts(q as string, filterParams, options);
  return ApiResponse.paginated(res, 'Search results', data, meta);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  ApiResponse.success(res, 'Product retrieved', { product });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  ApiResponse.success(res, 'Product retrieved', { product });
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getFeaturedProducts();
  ApiResponse.success(res, 'Featured products retrieved', { products });
});

export const getNewArrivals = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getNewArrivals();
  ApiResponse.success(res, 'New arrivals retrieved', { products });
});

export const getBestSellers = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.getBestSellers();
  ApiResponse.success(res, 'Best sellers retrieved', { products });
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const { productId, categoryId } = req.params;
  const products = await productService.getRelatedProducts(productId, categoryId);
  ApiResponse.success(res, 'Related products retrieved', { products });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const imageFiles = (req.files as Express.Multer.File[]) || [];
  if (imageFiles.length === 0) {
    return ApiResponse.badRequest(res, 'At least one product image is required');
  }
  const product = await productService.createProduct(normalizeProductNumbers(req.body), imageFiles);
  return ApiResponse.created(res, 'Product created successfully', { product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const imageFiles = (req.files as Express.Multer.File[]) || [];
  const product = await productService.updateProduct(req.params.id, normalizeProductNumbers(req.body), imageFiles);
  ApiResponse.success(res, 'Product updated successfully', { product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  ApiResponse.success(res, 'Product deleted successfully');
});

export const deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
  const { id, publicId } = req.params;
  const product = await productService.deleteProductImage(id, decodeURIComponent(publicId));
  ApiResponse.success(res, 'Image deleted', { product });
});

export const getProductDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await productService.getDashboardStats();
  ApiResponse.success(res, 'Product stats retrieved', { stats });
});
