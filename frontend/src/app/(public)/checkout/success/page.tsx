'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchOrderById } from '@/features/orders/ordersSlice';
import { formatPrice, formatDate, formatPaymentMethod } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const dispatch = useAppDispatch();
  const { currentOrder: order, isLoading } = useAppSelector((s) => s.orders);
  const isQrVerificationPending =
    order?.paymentInfo.method === 'upi' && order.paymentInfo.status === 'processing';

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  if (!orderId) {
    return (
      <div className="container-custom py-24 text-center">
        <p className="text-muted">No order information found.</p>
        <Link href="/products" className="btn-primary mt-4 inline-block">Continue Shopping</Link>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullPage label="Loading order details…" />;
  }

  return (
    <div className="container-custom py-16 md:py-24 max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <h1 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-3">
        {isQrVerificationPending ? 'Payment Proof Submitted!' : 'Order Placed Successfully!'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {isQrVerificationPending
          ? 'We’ll confirm your order after verifying the QR payment. You can track its status from your account.'
          : 'Thank you for shopping with PP’s Aura. We’ll send you a confirmation email shortly.'}
      </p>

      {order && (
        <div className="bg-white rounded-2xl border border-border p-6 text-left mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Number</p>
              <p className="font-bold text-foreground text-lg">#{order.orderNumber}</p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <p className="font-medium">{formatPaymentMethod(order.paymentInfo.method)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-1">Delivering to</p>
            <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={order ? `/dashboard/orders/${order._id}` : '/dashboard/orders'}
          className="btn-primary flex items-center justify-center gap-2"
        >
          Track Order
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/products" className="btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
