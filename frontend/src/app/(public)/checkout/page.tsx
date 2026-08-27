'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileImage, Loader2, MapPin, CreditCard, ChevronLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/hooks/useStore';
import { createOrder } from '@/features/orders/ordersSlice';
import { checkoutSchema, type CheckoutFormData } from '@/validations/checkout.schema';
import { INDIAN_STATES, PAYMENT_METHODS } from '@/constants';
import { formatPrice } from '@/utils/helpers';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import toast from 'react-hot-toast';
import type { Address, Order } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, fetchCurrentUser } = useAuth();
  const {
    items,
    summary,
    coupon,
    loyaltyPointsToRedeem,
    emptyCart,
  } = useCart();
  const defaultAddress = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];
  const [isPlacing, setIsPlacing] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(user?.addresses ?? []);
  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress?._id ?? 'new'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      paymentMethod: 'upi',
    },
  });
  const paymentMethod = watch('paymentMethod');

  const applyAddress = (address: Address) => {
    setValue('shippingAddress.fullName', address.fullName, { shouldValidate: true });
    setValue('shippingAddress.phone', address.phone, { shouldValidate: true });
    setValue('shippingAddress.addressLine1', address.addressLine1, { shouldValidate: true });
    setValue('shippingAddress.addressLine2', address.addressLine2 ?? '', { shouldValidate: true });
    setValue('shippingAddress.city', address.city, { shouldValidate: true });
    setValue('shippingAddress.state', address.state, { shouldValidate: true });
    setValue('shippingAddress.pincode', address.pincode, { shouldValidate: true });
    setValue('shippingAddress.country', address.country || 'India');
  };

  const clearAddressForm = () => {
    setValue('shippingAddress.fullName', user?.name ?? '');
    setValue('shippingAddress.phone', user?.phone ?? '');
    setValue('shippingAddress.addressLine1', '');
    setValue('shippingAddress.addressLine2', '');
    setValue('shippingAddress.city', '');
    setValue('shippingAddress.state', '');
    setValue('shippingAddress.pincode', '');
    setValue('shippingAddress.country', 'India');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    userService.getAddresses()
      .then(({ addresses }) => {
        setSavedAddresses(addresses);
        const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
        if (preferred) {
          setSelectedAddressId(preferred._id);
          applyAddress(preferred);
        } else {
          setSelectedAddressId('new');
        }
      })
      .catch(() => setSavedAddresses(user?.addresses ?? []));
  // Loading the authenticated customer's address book once is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [isAuthenticated, items.length, router]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (data.paymentMethod === 'upi') {
      if (!transactionId.trim()) {
        toast.error('Enter the transaction ID or UTR after completing the QR payment.');
        return;
      }
      if (!paymentScreenshot) {
        toast.error('Upload a screenshot of the completed QR payment.');
        return;
      }
      if (paymentScreenshot.size > 5 * 1024 * 1024) {
        toast.error('Payment screenshot must be 5 MB or smaller.');
        return;
      }
    }

    setIsPlacing(true);
    try {
      let order = pendingOrder;
      if (order && order.paymentInfo.method !== data.paymentMethod) {
        toast.error('An order is already awaiting payment. Please retry using the originally selected payment method.');
        return;
      }
      if (!order) {
        const orderData = {
          items: items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            color: item.color,
          })),
          shippingAddress: data.shippingAddress,
          paymentMethod: data.paymentMethod,
          couponCode: coupon.code ?? undefined,
          loyaltyPointsToRedeem: loyaltyPointsToRedeem || undefined,
          notes: data.notes,
        };

        const result = await dispatch(createOrder(orderData));
        if (!createOrder.fulfilled.match(result)) {
          toast.error((result.payload as string) || 'Failed to place order');
          return;
        }
        order = result.payload.order;
        setPendingOrder(order);
        await fetchCurrentUser();
      }

      await orderService.submitManualPaymentProof(order._id, transactionId.trim(), paymentScreenshot!);
      setPendingOrder(null);
      emptyCart();
      toast.success('Payment proof submitted. Your order is awaiting verification.');
      router.push(`/checkout/success?orderId=${order._id}`);
    } catch (error: unknown) {
      const requestError = error as { response?: { data?: { message?: string } } };
      toast.error(requestError.response?.data?.message || 'Something went wrong. Please try again.');
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
            {savedAddresses.length > 0 ? (
              <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <label htmlFor="saved-address" className="label">Choose a saved address</label>
                <select
                  id="saved-address"
                  value={selectedAddressId}
                  onChange={(event) => {
                    const addressId = event.target.value;
                    setSelectedAddressId(addressId);
                    if (addressId === 'new') {
                      clearAddressForm();
                      return;
                    }
                    const selected = savedAddresses.find((address) => address._id === addressId);
                    if (selected) applyAddress(selected);
                  }}
                  className="input-field bg-white"
                >
                  {savedAddresses.map((address) => (
                    <option key={address._id} value={address._id}>
                      {(address.type || 'home').replace(/^./, (letter) => letter.toUpperCase())}
                      {address.isDefault ? ' (Default)' : ''} — {address.addressLine1}, {address.city}
                    </option>
                  ))}
                  <option value="new">+ Enter a new address</option>
                </select>
              </div>
            ) : (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                You do not have a saved address yet. Enter one below and it will be saved as your Home address.
              </p>
            )}
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
            {paymentMethod === 'upi' && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="shrink-0 rounded-xl border border-border bg-white p-2">
                    <Image
                      src="/images/qrcode_docs.google.com.png"
                      alt="PP’s Aura payment QR code"
                      width={190}
                      height={190}
                      className="h-44 w-44 object-contain"
                    />
                  </div>
                  <div className="w-full space-y-4">
                    <div>
                      <p className="font-semibold text-foreground">Scan and pay {formatPrice(summary.total)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Use any UPI app, then enter the transaction reference and upload the payment screenshot.</p>
                    </div>
                    <div>
                      <label className="label">Transaction ID / UTR *</label>
                      <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} maxLength={150} className="input-field bg-white" placeholder="Enter transaction reference" />
                    </div>
                    <div>
                      <label className="label">Payment screenshot *</label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-white p-3 text-sm text-muted-foreground hover:bg-primary/5">
                        <FileImage className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 truncate">{paymentScreenshot?.name || 'Choose payment screenshot'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => setPaymentScreenshot(event.target.files?.[0] || null)} />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, or GIF up to 5 MB.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(summary.couponDiscount)}</span>
                </div>
              )}
              {summary.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Loyalty points ({loyaltyPointsToRedeem})</span>
                  <span>−{formatPrice(summary.loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(summary.total)}
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
                'Submit QR Payment'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
