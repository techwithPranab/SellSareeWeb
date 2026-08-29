'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye, Zap } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { toggleWishlist, selectIsInWishlist } from '@/features/wishlist/wishlistSlice';
import { formatPrice, getProductDiscountPercent, getProductEffectivePrice, isProductComingSoon, formatDate, cn } from '@/utils/helpers';

// ─────────────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  className?: string;
  showQuickAdd?: boolean;
}

export default function ProductCard({
  product,
  className,
  showQuickAdd = true,
}: ProductCardProps) {
  const dispatch = useAppDispatch();
  const isWishlisted = useAppSelector(selectIsInWishlist(product._id));
  const { addItem, isInCart, getCartItemQuantity } = useCart();

  const isComingSoon = isProductComingSoon(product);
  const primaryImage = product.images?.[0]?.url ?? '/images/product-coming-soon.svg';
  const hoverImage = product.images?.[1]?.url ?? primaryImage;
  const effectivePrice = getProductEffectivePrice(product);
  const discountPercent = getProductDiscountPercent(product);

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(toggleWishlist(product._id));
    },
    [dispatch, product._id]
  );

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isComingSoon) return;
      addItem(product);
    },
    [addItem, isComingSoon, product]
  );

  const inCart = isInCart(product._id);
  const cartQuantity = getCartItemQuantity(product._id);
  const stockLimitReached = cartQuantity >= product.stock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group relative', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 block"
          aria-label={`View ${product.name}`}
        >
          {/* Main Image */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-all duration-500 group-hover:opacity-0"
            loading="lazy"
          />
          {/* Hover Image */}
          <Image
            src={hoverImage}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="absolute inset-0 object-cover object-top opacity-0 transition-all duration-500 group-hover:opacity-100"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isComingSoon && (
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                Coming Soon
              </span>
            )}
            {!isComingSoon && discountPercent > 0 && (
              <span className="badge-discount">−{discountPercent}%</span>
            )}
            {!isComingSoon && product.isSale && (
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">Sale</span>
            )}
            {product.isNewArrival && (
              <span className="badge-new">New</span>
            )}
            {product.isFeatured && (
              <span className="badge-featured">
                <Zap className="w-2.5 h-2.5" /> Featured
              </span>
            )}
            {!isComingSoon && product.stock === 0 && (
              <span className="badge-sold-out">Sold Out</span>
            )}
          </div>
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 shadow-sm',
            isWishlisted
              ? 'bg-primary text-white scale-110'
              : 'bg-white/90 text-foreground hover:bg-primary hover:text-white opacity-0 group-hover:opacity-100'
          )}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
        </button>

        {/* Quick Actions */}
        {showQuickAdd && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isComingSoon || stockLimitReached}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-md',
                isComingSoon
                  ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                  : stockLimitReached
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : inCart
                  ? 'bg-green-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {isComingSoon ? 'Coming Soon' : product.stock === 0 ? 'Out of Stock' : stockLimitReached ? 'Maximum in Cart' : inCart ? 'In Cart' : 'Add to Cart'}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="p-2 bg-white/90 rounded-lg hover:bg-white shadow-md transition-colors"
              aria-label="View product details"
            >
              <Eye className="w-4 h-4 text-foreground" />
            </Link>
          </div>
        )}
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        {/* Product Info */}
        <div className="mt-3 space-y-1.5 px-1">
          {/* Category tag */}
          {product.category && (
            <p className="text-xs text-muted uppercase tracking-wider font-medium">
              {typeof product.category === 'object' ? product.category.name : product.category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
          {isComingSoon && product.launchDate && (
            <p className="text-xs font-medium text-amber-700">Launching {formatDate(product.launchDate)}</p>
          )}

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3 h-3',
                      i < Math.round(product.averageRating)
                        ? 'fill-secondary text-secondary'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">({product.totalReviews})</span>
            </div>
          )}

          {/* Pricing */}
          {isComingSoon ? (
            <div className="relative h-8 overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
              <div aria-hidden="true" className="absolute inset-0 select-none bg-white/40 blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/65 px-2 text-center text-xs font-semibold text-amber-700 backdrop-blur-sm">
                Price revealed at launch
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={cn('text-base font-bold', product.isSale ? 'text-red-600' : 'text-foreground')}
                aria-label={`${product.isSale ? 'Sale' : 'Discounted'} price ${formatPrice(effectivePrice)}`}
              >
                {formatPrice(effectivePrice)}
              </span>
              <span
                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 line-through decoration-red-500 decoration-2"
                aria-label={`MRP ${formatPrice(product.price)}`}
              >
                MRP {formatPrice(product.price)}
              </span>
            </div>
          )}

          {/* Fabric tag */}
          {product.fabric && (
            <span className="inline-block text-xs bg-surface text-muted px-2 py-0.5 rounded-full border border-border">
              {product.fabric}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
