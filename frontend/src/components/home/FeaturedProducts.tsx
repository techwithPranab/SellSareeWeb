'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/hooks/useStore';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/common/LoadingSpinner';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  seeAllHref: string;
  seeAllLabel?: string;
  products: ReturnType<typeof useAppSelector<any>>;
  isLoading?: boolean;
}

export default function FeaturedProducts({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = 'View All',
  products = [],
  isLoading = false,
}: FeaturedProductsProps) {
  return (
    <section className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="text-muted mt-2 max-w-lg">{subtitle}</p>}
          </div>
          <Link
            href={seeAllHref}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors shrink-0"
          >
            {seeAllLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 8).map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Mobile See All */}
        <div className="text-center mt-8 sm:hidden">
          <Link href={seeAllHref} className="btn-outline">
            {seeAllLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
