import React from 'react';
import { cn } from '@/utils/helpers';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  className,
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'rounded-full border-primary/30 border-t-primary animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label={label ?? 'Loading…'}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted font-medium">{label ?? 'Loading…'}</p>
      </div>
    );
  }

  if (label) {
    return (
      <div className="flex items-center gap-3">
        {spinner}
        <span className="text-sm text-muted">{label}</span>
      </div>
    );
  }

  return spinner;
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-3" />
      <div className="space-y-2 px-1">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-custom py-10 animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <ProductGridSkeleton />
    </div>
  );
}
