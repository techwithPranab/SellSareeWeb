'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
  Share2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchProductBySlug, addToRecentlyViewed } from '@/features/products/productsSlice';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useCart } from '@/hooks/useCart';
import ProductCard from '@/components/product/ProductCard';
import LoadingSpinner, { ProductGridSkeleton } from '@/components/common/LoadingSpinner';
import {
  formatPrice,
  formatDiscount,
  getProductDefaultImage,
  getStockLabel,
  getStockColor,
  cn,
} from '@/utils/helpers';
import { productService } from '@/services/product.service';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { currentProduct: product, isLoading, error } = useAppSelector((s) => s.products);
  const isWishlisted = useAppSelector((s) =>
    product ? s.wishlist.productIds.includes(product._id) : false
  );
  const { addItem, isInCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  useEffect(() => {
    if (product) {
      dispatch(addToRecentlyViewed(product));
      const categoryId =
        typeof product.category === 'object' ? product.category._id : product.category;
      if (categoryId) {
        setLoadingRelated(true);
        productService
          .getRelatedProducts(product._id, categoryId)
          .then((res) => setRelatedProducts(res.products.filter((p) => p._id !== product._id)))
          .catch(() => setRelatedProducts([]))
          .finally(() => setLoadingRelated(false));
      }
    }
  }, [product, dispatch]);

  if (isLoading) {
    return (
      <div className="container-custom py-10">
        <LoadingSpinner fullPage label="Loading product…" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-custom py-24 text-center">
        <span className="text-6xl mb-4 block">🪁</span>
        <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
        <p className="text-muted mb-6">The saree you&apos;re looking for may have been removed.</p>
        <Link href="/products" className="btn-primary">
          Browse All Sarees
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ url: getProductDefaultImage(product), publicId: '', isDefault: true, sortOrder: 0 }];
  const effectivePrice = product.salePrice || product.price;
  const discountPercent =
    product.salePrice && product.salePrice < product.price
      ? formatDiscount(product.price, product.salePrice)
      : 0;
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;
  const inCart = isInCart(product._id);

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-primary transition-colors">Sarees</Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${typeof product.category === 'object' ? product.category.slug : ''}`}
              className="hover:text-primary transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface border border-border">
            <Image
              src={images[selectedImage]?.url ?? getProductDefaultImage(product)}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 badge-discount">−{discountPercent}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative w-20 h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                    selectedImage === i ? 'border-primary' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {categoryName && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {categoryName}
            </p>
          )}
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(product.averageRating)
                        ? 'fill-secondary text-secondary'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted">
                {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{formatPrice(effectivePrice)}</span>
            {discountPercent > 0 && (
              <>
                <span className="text-xl text-muted line-through">{formatPrice(product.price)}</span>
                <span className="text-sm font-semibold text-green-600">Save {discountPercent}%</span>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Fabric', value: product.fabric },
              { label: 'Pattern', value: product.pattern },
              { label: 'Color', value: product.color },
              { label: 'Saree Length', value: product.sareeLength },
              { label: 'Blouse Length', value: product.blouseLength },
              { label: 'SKU', value: product.sku },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label} className="bg-surface rounded-lg px-3 py-2">
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                  <p className="font-medium text-foreground capitalize">{item.value}</p>
                </div>
              ))}
          </div>

          <p className={cn('text-sm font-medium', getStockColor(product.stock))}>
            {getStockLabel(product.stock)}
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-muted/50 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="p-2.5 hover:bg-muted/50 transition-colors disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={cn(
                'flex-1 min-w-[200px] btn-primary flex items-center justify-center gap-2',
                inCart && 'bg-green-600 hover:bg-green-700'
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              {inCart ? 'Add More to Cart' : 'Add to Cart'}
            </button>
            <button
              onClick={() => dispatch(toggleWishlist(product._id))}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                isWishlisted
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:border-primary hover:text-primary'
              )}
              aria-label="Toggle wishlist"
            >
              <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
            </button>
            <button
              className="p-3 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
              aria-label="Share product"
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Orders ₹999+' },
              { icon: ShieldCheck, label: 'Authentic', sub: '100% Genuine' },
            ].map((badge) => (
              <div key={badge.label} className="text-center p-3 bg-surface rounded-xl">
                <badge.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                <p className="text-[10px] text-muted">{badge.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Care */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-playfair text-xl font-bold text-foreground mb-4">Description</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
          {product.occasion?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.occasion.map((occ) => (
                <span key={occ} className="text-xs px-3 py-1 rounded-full bg-surface border border-border">
                  {occ}
                </span>
              ))}
            </div>
          )}
        </div>
        {product.careInstructions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-playfair text-xl font-bold text-foreground mb-4">Care Instructions</h2>
            <ul className="space-y-2">
              {product.careInstructions.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Related Products */}
      {(relatedProducts.length > 0 || loadingRelated) && (
        <section>
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
          {loadingRelated ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
