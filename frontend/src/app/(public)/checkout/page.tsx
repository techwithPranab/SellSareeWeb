'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MapPin, CreditCard, ChevronLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/hooks/useStore';
import { createOrder } from '@/features/orders/ordersSlice';
import { clearCart } from '@/features/cart/cartSlice';
import { checkoutSchema, type CheckoutFormData } from '@/validations/checkout.schema';
import { INDIAN_STATES, PAYMENT_METHODS } from '@/constants';
import { formatPrice } from '@/utils/helpers';
import { orderService } from '@/services/order.service';
import { RAZORPAY_KEY_ID } from '@/constants';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const { items, summary, coupon, emptyCart } = useCart();
  const [isPlacing, setIsPlacing] = useState(false);

  const defaultAddress = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        fullName: defaultAddress?.fullName ?? user?.name ?? '',
        phone: defaultAddress?.phone ?? user?.phone ?? '',
        addressLine1: defaultAddress?.addressLine1 ?? '',
        addressLine2: defaultAddress?.addressLine2 ?? '',
        city: defaultAddress?.city ?? '',
        state: defaultAddress?.state ?? '',
        pincode: defaultAddress?.pincode ?? '',
        country: 'India',
      },
      paymentMethod: 'razorpay',
    },
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [isAuthenticated, items.length, router]);

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsPlacing(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          color: item.color,
        })),
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        couponCode: coupon.code ?? undefined,
        notes: data.notes,
      };

      const result = await dispatch(createOrder(orderData));
      if (!createOrder.fulfilled.match(result)) {
        toast.error((result.payload as string) || 'Failed to place order');
        return;
      }

      const order = result.payload.order;

      if (data.paymentMethod === 'cod') {
        emptyCart();
        router.push(`/checkout/success?orderId=${order._id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !RAZORPAY_KEY_ID) {
        toast.error('Payment gateway unavailable. Please try COD or contact support.');
        return;
      }

      const paymentData = await orderService.initiatePayment(order._id, order.totalAmount);

      const rzp = new window.Razorpay({
        key: paymentData.key || RAZORPAY_KEY_ID,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Rupkatha Sarees',
        description: `Order #${order.orderNumber}`,
        order_id: paymentData.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await orderService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            emptyCart();
            router.push(`/checkout/success?orderId=${order._id}`);
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: data.shippingAddress.fullName,
          contact: data.shippingAddress.phone,
          email: user?.email,
        },
        theme: { color: '#b5451b' },
      });
      rzp.open();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (!isAuthenticated || items.length === 0) return null;

  return (
    <div className="container-custom py-8 md:py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Cart
      </Link>

      <h1 className="font-playfair text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <section className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-lg text-foreground mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name</label>
                <input {...register('shippingAddress.fullName')} className="input-field" />
                {errors.shippingAddress?.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('shippingAddress.phone')} className="input-field" />
                {errors.shippingAddress?.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.phone.message}</p>
                )}
              </div>
              <div>
                <label className="label">Pincode</label>
                <input {...register('shippingAddress.pincode')} className="input-field" />
                {errors.shippingAddress?.pincode && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.pincode.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address Line 1</label>
                <input {...register('shippingAddress.addressLine1')} className="input-field" />
                {errors.shippingAddress?.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.addressLine1.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address Line 2 (Optional)</label>
                <input {...register('shippingAddress.addressLine2')} className="input-field" />
              </div>
              <div>
                <label className="label">City</label>
                <input {...register('shippingAddress.city')} className="input-field" />
                {errors.shippingAddress?.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.city.message}</p>
                )}
              </div>
              <div>
                <label className="label">State</label>
                <select {...register('shippingAddress.state')} className="input-field">
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.shippingAddress?.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.state.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-lg text-foreground mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    value={method.id}
                    {...register('paymentMethod')}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <span>{method.icon}</span>
                      {method.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Order Notes */}
          <section className="bg-white rounded-2xl border border-border p-6">
            <label className="label">Order Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any special instructions for delivery…"
              className="input-field resize-none"
            />
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold text-lg text-foreground">Order Summary</h2>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground line-clamp-1 flex-1">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{summary.shippingCharge === 0 ? 'FREE' : formatPrice(summary.shippingCharge)}</span>
              </div>
              {paymentMethod === 'cod' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Charges</span>
                  <span>{formatPrice(summary.codCharges)}</span>
                </div>
              )}
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(summary.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(
                    paymentMethod === 'cod'
                      ? summary.total + summary.codCharges
                      : summary.total
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPlacing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isPlacing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order…
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
