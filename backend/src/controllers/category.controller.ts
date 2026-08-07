import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants';
import Category from '../models/Category';
import { cloudinary } from '../config/cloudinary';

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .populate('children')
    .sort({ sortOrder: 1, name: 1 });

  ApiResponse.success(res, 'Categories retrieved', { categories });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).populate('parent').populate('children');
  if (!category) {
    return ApiResponse.notFound(res, 'Category not found');
  }
  ApiResponse.success(res, 'Category retrieved', { category });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('parent')
    .populate('children');
  if (!category) {
    return ApiResponse.notFound(res, 'Category not found');
  }
  ApiResponse.success(res, 'Category retrieved', { category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, parent, sortOrder } = req.body;
  const imageFile = req.file;

  let imageData: { image?: string; imagePublicId?: string } = {};

  if (imageFile) {
    const b64 = Buffer.from(imageFile.buffer).toString('base64');
    const dataURI = `data:${imageFile.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'rupkatha-sarees/categories',
    });
    imageData = { image: result.secure_url, imagePublicId: result.public_id };
  }

  let level = 0;
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (parentCategory) {
      level = parentCategory.level + 1;
    }
  }

  const category = await Category.create({
    name,
    description,
    parent: parent || null,
    level,
    sortOrder: sortOrder || 0,
    ...imageData,
  });

  ApiResponse.created(res, 'Category created', { category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, parent, sortOrder, isActive } = req.body;
  const imageFile = req.file;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return ApiResponse.notFound(res, 'Category not found');
  }

  let imageData: { image?: string; imagePublicId?: string } = {};

  if (imageFile) {
    // Delete old image if exists
    if (category.imagePublicId) {
      await cloudinary.uploader.destroy(category.imagePublicId).catch(console.error);
    }

    const b64 = Buffer.from(imageFile.buffer).toString('base64');
    const dataURI = `data:${imageFile.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'rupkatha-sarees/categories',
    });
    imageData = { image: result.secure_url, imagePublicId: result.public_id };
  }

  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, parent, sortOrder, isActive, ...imageData },
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, 'Category updated', { category: updated });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return ApiResponse.notFound(res, 'Category not found');
  }

  // Check for sub-categories
  const hasChildren = await Category.exists({ parent: req.params.id });
  if (hasChildren) {
    return ApiResponse.badRequest(res, 'Cannot delete category with sub-categories');
  }

  // Delete image from Cloudinary
  if (category.imagePublicId) {
    await cloudinary.uploader.destroy(category.imagePublicId).catch(console.error);
  }

  await Category.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, 'Category deleted');
});
