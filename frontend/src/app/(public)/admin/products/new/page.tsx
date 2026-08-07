'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';
import { asRoute } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData, images: File[]) => {
    if (images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }
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

      const { product } = await adminService.createProduct(formData);
      toast.success('Product created successfully');
      router.push(asRoute(`/admin/products/${product._id}/edit`));
    } catch {
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Add New Product" backHref="/admin/products" />
      <div className="bg-white rounded-2xl border border-border p-6">
        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
