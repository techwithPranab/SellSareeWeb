'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Loader2, Trash2, Upload, X } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { FABRICS, OCCASIONS } from '@/constants';
import type { Product, Category } from '@/types';

export interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: string;
  fabric: string;
  color: string;
  colorCode: string;
  pattern: string;
  price: number;
  discountedPrice?: number;
  salePrice?: number;
  isSale: boolean;
  stock: number;
  sareeLength: string;
  blouseLength: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isBridal: boolean;
  launchDate: string;
  occasion: string;
  careInstructions: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData, images: File[]) => Promise<void>;
  onDeleteExistingImage?: (publicId: string) => Promise<void>;
  isSubmitting: boolean;
}

const toIndiaDateInput = (value?: string | null): string => {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export default function ProductForm({ product, onSubmit, onDeleteExistingImage, isSubmitting }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      shortDescription: product?.shortDescription ?? '',
      sku: product?.sku ?? '',
      category: typeof product?.category === 'object' ? product.category._id : product?.category ?? '',
      fabric: product?.fabric ?? '',
      color: product?.color ?? '',
      colorCode: product?.colorCode ?? '#000000',
      pattern: product?.pattern ?? '',
      price: product?.price ?? 0,
      discountedPrice: product?.discountedPrice,
      salePrice: product?.salePrice,
      isSale: product?.isSale ?? false,
      stock: product?.stock ?? 0,
      sareeLength: product?.sareeLength ?? '5.5 meters',
      blouseLength: product?.blouseLength ?? '80 cm',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isNewArrival: product?.isNewArrival ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      isBridal: product?.isBridal ?? false,
      launchDate: toIndiaDateInput(product?.launchDate),
      occasion: product?.occasion?.join(', ') ?? '',
      careInstructions: product?.careInstructions?.join('\n') ?? '',
    },
  });
  const launchDate = watch('launchDate');
  const isSale = watch('isSale');
  const mrp = watch('price');
  const discountedPrice = watch('discountedPrice');
  const salePrice = watch('salePrice');
  const launchStatus = launchDate
    ? new Date(`${launchDate}T00:00:00+05:30`).getTime() > Date.now()
      ? 'coming-soon'
      : 'launched'
    : 'available';

  useEffect(() => {
    categoryService.getCategories().then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    const previews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [images]);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data, images);
    setImages([]);
  };

  const handleDeleteExistingImage = async (publicId: string) => {
    if (!onDeleteExistingImage || !window.confirm('Delete this product image permanently?')) return;
    setDeletingImageId(publicId);
    try {
      await onDeleteExistingImage(publicId);
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Product Name *</label>
          <input {...register('name', { required: 'Name is required' })} className="input-field" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">SKU *</label>
          <input {...register('sku', { required: 'SKU is required' })} className="input-field" />
          {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
        </div>
        <div>
          <label className="label">Category *</label>
          <select {...register('category', { required: 'Category is required' })} className="input-field">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">MRP (₹) *</label>
          <input type="number" {...register('price', { required: true, min: 0, valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label">Discounted Price (₹)</label>
          <input
            type="number"
            {...register('discountedPrice', {
              min: 0,
              validate: (value) => value === undefined || value <= mrp || 'Discounted price cannot exceed MRP',
              setValueAs: (value) => value === '' ? undefined : Number(value),
            })}
            className="input-field"
          />
          {errors.discountedPrice && <p className="mt-1 text-xs text-red-500">{errors.discountedPrice.message}</p>}
        </div>
        <div>
          <label className="label">Sale Price (₹)</label>
          <input
            type="number"
            {...register('salePrice', {
              min: 0,
              required: isSale ? 'Sale price is required when marked as Sale' : false,
              validate: (value) => !isSale || value === undefined || value <= (discountedPrice ?? mrp) || 'Sale price cannot exceed discounted price',
              setValueAs: (value) => value === '' ? undefined : Number(value),
            })}
            disabled={!isSale}
            className="input-field"
          />
          {errors.salePrice && <p className="mt-1 text-xs text-red-500">{errors.salePrice.message}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Only used when “Sale” is enabled.</p>
        </div>
        <div>
          <label className="label">Stock *</label>
          <input type="number" {...register('stock', { required: true, min: 0, valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label">Launch Date</label>
          <input type="date" {...register('launchDate')} className="input-field" />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                launchStatus === 'coming-soon'
                  ? 'bg-amber-500'
                  : launchStatus === 'launched'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
              }`}
            />
            <span className="font-medium text-muted-foreground">
              {launchStatus === 'coming-soon'
                ? 'Coming Soon — purchasing is disabled'
                : launchStatus === 'launched'
                  ? 'Launched'
                  : 'Available immediately'}
            </span>
          </div>
        </div>
        <div>
          <label className="label">Fabric *</label>
          <select {...register('fabric', { required: true })} className="input-field">
            <option value="">Select fabric</option>
            {FABRICS.map((f) => <option key={f} value={f.toLowerCase()}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Color *</label>
          <input {...register('color', { required: true })} className="input-field" />
        </div>
        <div>
          <label className="label">Pattern</label>
          <input {...register('pattern')} className="input-field" />
        </div>
        <div>
          <label className="label">Occasions (comma-separated)</label>
          <input {...register('occasion')} placeholder="Wedding, Festival" className="input-field" />
        </div>
      </div>

      <div>
        <label className="label">Short Description</label>
        <textarea {...register('shortDescription')} rows={2} className="input-field resize-none" />
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea {...register('description', { required: true })} rows={4} className="input-field resize-none" />
      </div>
      <div>
        <label className="label">Care Instructions (one per line)</label>
        <textarea {...register('careInstructions')} rows={3} className="input-field resize-none" />
      </div>

      <div className="flex flex-wrap gap-4">
        {(['isActive', 'isFeatured', 'isNewArrival', 'isBestSeller', 'isBridal', 'isSale'] as const).map((field) => (
          <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register(field)} className="accent-primary" />
            {field.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
          </label>
        ))}
      </div>

      <div>
          <label className="label">{product ? 'Product Images' : 'Product Images *'}</label>

          {product && product.images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {product.images.map((image, index) => (
                <div key={image.publicId} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
                  <Image src={image.url} alt={image.alt || product.name} fill sizes="160px" className="object-cover" />
                  {image.isDefault && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">Primary</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(image.publicId)}
                    disabled={deletingImageId === image.publicId || isSubmitting}
                    className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-60"
                    aria-label={`Delete image ${index + 1}`}
                    title="Delete image"
                  >
                    {deletingImageId === image.publicId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {product ? 'Click to add new images' : 'Click to upload images'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                setImages((current) => [...current, ...selected]);
                e.target.value = '';
              }}
            />
          </label>
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">New images to upload ({images.length})</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {imagePreviews.map((preview, index) => (
                  <div key={`${images[index]?.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-primary/40 bg-surface">
                    <Image src={preview} alt={images[index]?.name || 'New product image'} fill sizes="160px" unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                      className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-red-600 shadow-sm hover:bg-red-50"
                      aria-label={`Remove selected image ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {product ? 'Update Product' : 'Create Product'}
      </button>
    </form>
  );
}
