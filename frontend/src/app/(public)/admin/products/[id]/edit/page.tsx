'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      adminService.getProduct(id)
        .then((res) => setProduct(res.product))
        .catch(() => toast.error('Failed to load product'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (data: ProductFormData, images: File[]) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'occasion') {
            const occasions = (value as string).split(',').map((o) => o.trim()).filter(Boolean);
            occasions.forEach((o) => formData.append('occasion', o));
          } else if (key === 'careInstructions') {
            const instructions = (value as string).split('\n').map((i) => i.trim()).filter(Boolean);
            instructions.forEach((i) => formData.append('careInstructions', i));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      images.forEach((file) => formData.append('images', file));

      const { product: updated } = await adminService.updateProduct(id, formData);
      setProduct(updated);
      toast.success('Product updated successfully');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading product…" />;
  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  return (
    <div>
      <AdminPageHeader title={`Edit: ${product.name}`} backHref="/admin/products" />
      <div className="bg-white rounded-2xl border border-border p-6">
        <ProductForm product={product} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
