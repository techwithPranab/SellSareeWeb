'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useAppSelector } from '@/hooks/useStore';
import { selectWishlistIds } from '@/features/wishlist/wishlistSlice';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/common/LoadingSpinner';
import type { Product } from '@/types';

export default function WishlistPage() {
  const productIds = useAppSelector(selectWishlistIds);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }
    setIsLoading(true);
    Promise.all(
      productIds.map((id) =>
        productService.getProductById(id).then((r) => r.product).catch(() => null)
      )
    )
      .then((results) => setProducts(results.filter((p): p is Product => p !== null)))
      .finally(() => setIsLoading(false));
  }, [productIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {productIds.length} saree{productIds.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Heart className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Save your favourite sarees by clicking the heart icon on any product.
          </p>
          <Link href="/products" className="btn-primary btn-sm">Explore Sarees</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
