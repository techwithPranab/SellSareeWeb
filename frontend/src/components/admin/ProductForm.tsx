'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Upload } from 'lucide-react';
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
  salePrice?: number;
  stock: number;
  sareeLength: string;
  blouseLength: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isBridal: boolean;
  occasion: string;
  careInstructions: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData, images: File[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
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
      salePrice: product?.salePrice,
      stock: product?.stock ?? 0,
      sareeLength: product?.sareeLength ?? '5.5 meters',
      blouseLength: product?.blouseLength ?? '80 cm',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isNewArrival: product?.isNewArrival ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      isBridal: product?.isBridal ?? false,
      occasion: product?.occasion?.join(', ') ?? '',
      careInstructions: product?.careInstructions?.join('\n') ?? '',
    },
  });

  useEffect(() => {
    categoryService.getCategories().then((res) => setCategories(res.categories));
  }, []);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data, images);
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
          <label className="label">Price (₹) *</label>
          <input type="number" {...register('price', { required: true, min: 0, valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label">Sale Price (₹)</label>
          <input type="number" {...register('salePrice', { min: 0, valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label">Stock *</label>
          <input type="number" {...register('stock', { required: true, min: 0, valueAsNumber: true })} className="input-field" />
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
        {(['isActive', 'isFeatured', 'isNewArrival', 'isBestSeller', 'isBridal'] as const).map((field) => (
          <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register(field)} className="accent-primary" />
            {field.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
          </label>
        ))}
      </div>

      {!product && (
        <div>
          <label className="label">Product Images *</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            />
          </label>
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{images.length} file(s) selected</p>
          )}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {product ? 'Update Product' : 'Create Product'}
      </button>
    </form>
  );
}
