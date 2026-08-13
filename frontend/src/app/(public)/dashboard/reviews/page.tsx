'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { userService } from '@/services/user.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import type { Review } from '@/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
        />
      ))}
    </div>
  );
}

type ReviewProduct = {
  name: string;
  slug: string;
  images?: { url: string }[];
};

function isReviewProduct(product: unknown): product is ReviewProduct {
  return Boolean(
    product &&
      typeof product === 'object' &&
      'name' in product &&
      typeof product.name === 'string' &&
      'slug' in product &&
      typeof product.slug === 'string'
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userService
      .getMyReviews({ limit: 50 })
      .then((res) => setReviews(res.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-foreground">My Reviews</h1>
        <p className="text-muted-foreground text-sm mt-1">Reviews you&apos;ve written for purchased products</p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Star className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">No reviews yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            After receiving your order, you can leave a review from the order details page.
          </p>
          <Link href="/dashboard/orders" className="btn-primary btn-sm">View My Orders</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const product = review.product as unknown;
            const productDetails = isReviewProduct(product) ? product : null;
            const productImage = productDetails?.images?.[0]?.url;
            return (
              <div key={review._id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex gap-4">
                  {productImage && (
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-surface shrink-0">
                      <Image src={productImage} alt={productDetails?.name ?? 'Reviewed product'} fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {productDetails ? (
                      <Link
                        href={`/products/${productDetails.slug}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {productDetails.name}
                      </Link>
                    ) : (
                      <p className="font-semibold text-muted-foreground">Product no longer available</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-2">{review.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{review.comment}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {review.isVerifiedPurchase && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                      {!review.isApproved && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          ⏳ Pending Approval
                        </span>
                      )}
                    </div>
                    {review.adminReply && (
                      <div className="mt-3 p-3 bg-surface rounded-lg border border-border text-sm">
                        <p className="font-semibold text-primary text-xs mb-1">Seller Response:</p>
                        <p className="text-muted-foreground">{review.adminReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
