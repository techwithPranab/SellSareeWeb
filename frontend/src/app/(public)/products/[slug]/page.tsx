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
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  Boxes,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchProductBySlug, addToRecentlyViewed } from '@/features/products/productsSlice';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import ProductCard from '@/components/product/ProductCard';
import LoadingSpinner, { ProductGridSkeleton } from '@/components/common/LoadingSpinner';
import {
  formatPrice,
  getProductDiscountPercent,
  getProductEffectivePrice,
  getProductDefaultImage,
  getStockColor,
  formatDate,
  isProductComingSoon,
  generateProductSchema,
  cn,
} from '@/utils/helpers';
import { productService } from '@/services/product.service';
import { userService } from '@/services/user.service';
import type { Product, Review } from '@/types';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { currentProduct: product, isLoading, error } = useAppSelector((s) => s.products);
  const isWishlisted = useAppSelector((s) =>
    product ? s.wishlist.productIds.includes(product._id) : false
  );
  const { addItem, isInCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?._id]);

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

  useEffect(() => {
    if (!product?._id) return;
    setLoadingReviews(true);
    userService
      .getProductReviews(product._id, { limit: 20 })
      .then((response) => setReviews(response.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [product?._id]);

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

  const isComingSoon = isProductComingSoon(product);
  const images = product.images?.length
    ? product.images
    : [{ url: '/images/product-coming-soon.svg', publicId: 'coming-soon', isDefault: true, sortOrder: 0 }];
  const effectivePrice = getProductEffectivePrice(product);
  const discountPercent = getProductDiscountPercent(product);
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;
  const inCart = isInCart(product._id);

  const showPreviousImage = () => {
    setSelectedImage((current) => (current - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    setSelectedImage((current) => (current + 1) % images.length);
  };

  const handleAddToCart = () => {
    if (isComingSoon) return;
    addItem(product, quantity);
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reviewTitle.trim() || reviewComment.trim().length < 10) {
      toast.error('Add a title and at least 10 characters in your review.');
      return;
    }
    setSubmittingReview(true);
    try {
      await userService.createReview({
        productId: product._id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviewSubmitted(true);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted for admin approval.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container-custom py-8 md:py-12">
      {!isComingSoon && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProductSchema(product)).replace(/</g, '\\u003c') }}
      />}
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
              className="object-contain p-2 sm:p-4"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white hover:text-primary"
                  aria-label="Show previous product image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white hover:text-primary"
                  aria-label="Show next product image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                  {selectedImage + 1} / {images.length}
                </span>
              </>
            )}
            {!isComingSoon && discountPercent > 0 && (
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
                  <Image src={img.url} alt={`${product.name} image ${i + 1}`} fill sizes="80px" className="object-contain p-1" />
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

          {isComingSoon && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">Coming Soon</p>
              <p className="mt-1 text-sm text-amber-700">
                Launching on {formatDate(product.launchDate!)}. Add to Cart will be available after launch.
              </p>
            </div>
          )}

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

          {isComingSoon ? (
            <div className="relative h-14 max-w-sm overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
              <div aria-hidden="true" className="absolute inset-0 select-none bg-white/40 blur-md" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/65 px-4 text-center font-semibold text-amber-700 backdrop-blur-md">
                Price will be revealed on launch day
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-3">
              <span className={cn('text-3xl font-bold', product.isSale ? 'text-red-600' : 'text-foreground')}>
                {formatPrice(effectivePrice)}
              </span>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-base font-medium text-gray-600 line-through decoration-red-500 decoration-2">
                MRP {formatPrice(product.price)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-sm font-semibold text-green-600">Save {discountPercent}%</span>
                </>
              )}
            </div>
          )}

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

          {!isComingSoon && <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm">
            <Boxes className={cn('h-4 w-4', getStockColor(product.stock))} />
            <p className={cn('font-medium', getStockColor(product.stock))}>
              {product.stock > 0
                ? <><strong>{product.stock}</strong> {product.stock === 1 ? 'item' : 'items'} available in stock</>
                : 'Out of stock'}
            </p>
          </div>}

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
              disabled={product.stock === 0 || isComingSoon}
              className={cn(
                'flex-1 min-w-[200px] btn-primary flex items-center justify-center gap-2',
                isComingSoon
                  ? 'cursor-not-allowed bg-amber-100 text-amber-700 hover:bg-amber-100'
                  : inCart && 'bg-green-600 hover:bg-green-700'
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              {isComingSoon ? 'Coming Soon' : inCart ? 'Add More to Cart' : 'Add to Cart'}
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

      {/* Customer Reviews */}
      <section className="mb-16 rounded-2xl border border-border bg-white p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-foreground">Customer Reviews</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only admin-approved reviews are published.</p>
          </div>
          {product.totalReviews > 0 && (
            <p className="font-semibold text-foreground">
              {product.averageRating.toFixed(1)} / 5 · {product.totalReviews} reviews
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {loadingReviews ? (
              <LoadingSpinner label="Loading reviews…" />
            ) : reviews.length === 0 ? (
              <p className="rounded-xl bg-surface p-6 text-sm text-muted-foreground">
                No approved reviews yet. Be the first customer to share your experience.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {reviews.map((review) => (
                  <article key={review._id} className="py-5 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn('h-4 w-4', star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                        ))}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Verified Purchase</span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground">{review.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.user?.name || 'PP’s Aura customer'}
                    </p>
                    {review.adminReply && (
                      <div className="mt-3 rounded-lg bg-surface p-3 text-sm">
                        <p className="text-xs font-semibold text-primary">PP’s Aura response</p>
                        <p className="mt-1 text-muted-foreground">{review.adminReply}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold text-foreground">Write a Review</h3>
              {!isAuthenticated ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  <Link href={`/login?redirect=/products/${product.slug}`} className="font-semibold text-primary hover:underline">Sign in</Link>{' '}
                  to submit a review.
                </p>
              ) : reviewSubmitted ? (
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  Thank you. Your review is awaiting admin approval.
                </p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="label">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} aria-label={`Rate ${star} stars`}>
                          <Star className={cn('h-7 w-7', star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="review-title">Title</label>
                    <input id="review-title" value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} maxLength={100} className="input-field bg-white" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="review-comment">Your Review</label>
                    <textarea id="review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} minLength={10} maxLength={1000} rows={5} className="input-field resize-none bg-white" required />
                    <p className="mt-1 text-xs text-muted-foreground">Sexual, abusive, or offensive content is not allowed.</p>
                  </div>
                  <button type="submit" disabled={submittingReview} className="btn-primary flex w-full items-center justify-center gap-2">
                    {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submittingReview ? 'Submitting…' : 'Submit for Approval'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

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
