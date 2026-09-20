import { Request, Response } from 'express';
import GiftItem from '../models/GiftItem';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const payload = (body: Record<string, unknown>) => ({
  name: String(body.name || '').trim(), sku: String(body.sku || '').trim().toUpperCase(),
  stock: Number(body.stock), unitCost: Number(body.unitCost), isActive: body.isActive !== false,
  notes: String(body.notes || '').trim(),
});
const validate = (data: ReturnType<typeof payload>) => {
  if (!data.name || !data.sku) return 'Name and SKU are required';
  if (!Number.isSafeInteger(data.stock) || data.stock < 0) return 'Stock must be a non-negative whole number';
  if (!Number.isFinite(data.unitCost) || data.unitCost < 0) return 'Unit cost must be a non-negative number';
  return null;
};

export const getGiftItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await GiftItem.find(req.query.active === 'true' ? { isActive: true } : {}).sort({ isActive: -1, name: 1 });
  return ApiResponse.success(res, 'Gift inventory retrieved', { items });
});
export const createGiftItem = asyncHandler(async (req: Request, res: Response) => {
  const data = payload(req.body); const error = validate(data);
  if (error) return ApiResponse.badRequest(res, error);
  return ApiResponse.created(res, 'Gift item created', { item: await GiftItem.create(data) });
});
export const updateGiftItem = asyncHandler(async (req: Request, res: Response) => {
  const data = payload(req.body); const error = validate(data);
  if (error) return ApiResponse.badRequest(res, error);
  const item = await GiftItem.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!item) return ApiResponse.notFound(res, 'Gift item not found');
  return ApiResponse.success(res, 'Gift item updated', { item });
});
export const deleteGiftItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await GiftItem.findByIdAndDelete(req.params.id);
  if (!item) return ApiResponse.notFound(res, 'Gift item not found');
  return ApiResponse.success(res, 'Gift item deleted');
});
