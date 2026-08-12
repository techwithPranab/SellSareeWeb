'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowRight, Coins } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, getProductDefaultImage, cn } from '@/utils/helpers';
import { LOYALTY, SHIPPING } from '@/constants';

export default function CartPage() {
  const {
    items,
    summary,
    coupon,
    loyaltyPointsToRedeem,
    removeItem,
    updateItemQuantity,
    applyCouponCode,
    removeCouponCode,
    redeemLoyaltyPoints,
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const availableLoyaltyPoints = user?.loyaltyPoints ?? 0;
  const totalBeforeLoyalty = summary.subtotal + summary.shippingCharge - summary.couponDiscount;
  const maxPointsForOrder = Math.max(
    0,
    Math.floor((Math.max(0, totalBeforeLoyalty - 1) / LOYALTY.RUPEES_PER_POINT) + 1e-9)
  );
  const maxRedeemablePoints = Math.min(availableLoyaltyPoints, maxPointsForOrder);

  useEffect(() => {
    if (loyaltyPointsToRedeem > maxRedeemablePoints) {
      redeemLoyaltyPoints(maxRedeemablePoints);
    }
  }, [loyaltyPointsToRedeem, maxRedeemablePoints, redeemLoyaltyPoints]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await applyCouponCode(couponInput.trim().toUpperCase());
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h1>
        <p className="text-muted mb-8 max-w-sm mx-auto">
          Discover our beautiful collection of handcrafted sarees and add your favourites.
        </p>
        <Link href="/products" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="font-playfair text-3xl font-bold text-foreground mb-8">
        Shopping Cart
        <span className="text-muted text-lg font-normal ml-2">({summary.itemCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex gap-4 bg-white rounded-2xl border border-border p-4"
            >
              <Link
                href={`/products/${item.product.slug}`}
                className="relative w-24 h-32 shrink-0 rounded-xl overflow-hidden bg-surface"
              >
                <Image
                  src={getProductDefaultImage(item.product)}
                  alt={item.product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                {item.color && (
                  <p className="text-xs text-muted mt-0.5">Color: {item.color}</p>
                )}
                <p className="text-sm font-bold text-foreground mt-2">
                  {formatPrice(item.price)}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateItemQuantity(item._id, item.quantity - 1)}
                      className="p-1.5 hover:bg-muted/50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1.5 hover:bg-muted/50 transition-colors disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="p-2 text-muted hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-foreground">{formatPrice(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-6 sticky top-24 space-y-5">
            <h2 className="font-semibold text-lg text-foreground">Order Summary</h2>

            {/* Coupon */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-primary" />
                Coupon Code
              </label>
              {coupon.code ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-green-700">{coupon.code}</span>
                  <button
                    onClick={removeCouponCode}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME100"
                    className="input-field py-2 text-sm flex-1"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="btn-outline btn-sm shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Loyalty points */}
            <div className="border-t border-border pt-4">
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Coins className="h-4 w-4 text-amber-600" />
                Redeem Loyalty Points
              </label>
              {!isAuthenticated ? (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-muted-foreground">
                  <Link href="/login?redirect=/cart" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to view and redeem your loyalty points.
                </p>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">100 points = ₹1 discount</span>
                    <span className="font-semibold text-amber-700">
                      {availableLoyaltyPoints.toLocaleString('en-IN')} available
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxRedeemablePoints}
                      step={1}
                      value={loyaltyPointsToRedeem}
                      onChange={(event) => {
                        const points = Math.floor(Number(event.target.value) || 0);
                        redeemLoyaltyPoints(Math.min(Math.max(points, 0), maxRedeemablePoints));
                      }}
                      disabled={maxRedeemablePoints === 0}
                      className="input-field bg-white py-2 text-sm"
                      aria-label="Loyalty points to redeem"
                    />
                    <button
                      type="button"
                      onClick={() => redeemLoyaltyPoints(maxRedeemablePoints)}
                      disabled={maxRedeemablePoints === 0}
                      className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Use max
                    </button>
                  </div>
                  {loyaltyPointsToRedeem > 0 && (
                    <button
                      type="button"
                      onClick={() => redeemLoyaltyPoints(0)}
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      Remove points
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={cn('font-medium', summary.shippingCharge === 0 && 'text-green-600')}>
                  {summary.shippingCharge === 0 ? 'FREE' : formatPrice(summary.shippingCharge)}
                </span>
              </div>
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>−{formatPrice(summary.couponDiscount)}</span>
                </div>
              )}
              {summary.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Loyalty Points ({loyaltyPointsToRedeem})</span>
                  <span>−{formatPrice(summary.loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-border pt-3">
                <span>Total</span>
                <span className="text-primary">{formatPrice(summary.total)}</span>
              </div>
            </div>

            {summary.subtotal < SHIPPING.FREE_THRESHOLD && (
              <p className="text-xs text-muted-foreground bg-surface rounded-lg p-3">
                Add {formatPrice(SHIPPING.FREE_THRESHOLD - summary.subtotal)} more for free shipping!
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Earn {summary.loyaltyPointsEarned} loyalty points on this order
            </p>

            <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link href="/products" className="block text-center text-sm text-primary hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
