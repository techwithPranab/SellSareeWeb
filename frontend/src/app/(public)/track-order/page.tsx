'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ContentPage from '@/components/common/ContentPage';
import { formatDate } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import api from '@/services/api';

interface TrackedOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  shippingAddress: { fullName: string; city: string; state: string };
  trackingInfo?: { courier: string; trackingNumber: string; trackingUrl?: string; expectedDelivery?: string };
}

export default function TrackOrderPage() {
  const { isAuthenticated } = useAuth();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.get('/orders/track', { params: { orderNumber, email } });
      setResult(response.data.data.order as TrackedOrder);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Order not found. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentPage
      title="Track Your Order"
      subtitle="Enter your order details to check the current status of your delivery."
    >
      <div className="not-prose max-w-lg space-y-6">
        {isAuthenticated ? (
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <Package className="w-10 h-10 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground text-sm mb-4">
              You&apos;re signed in! View all your orders in your dashboard.
            </p>
            <Link href="/dashboard/orders" className="btn-primary btn-sm">
              Go to My Orders
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <div>
                <label className="label">Order Number</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. RUP-20250101-001"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email used during checkout"
                  className="input-field"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Track Order
              </button>
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                {' '}for easier order tracking
              </p>
            </form>

            {result && (
              <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground text-lg">#{result.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">Placed on {formatDate(result.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.shippingAddress.fullName} · {result.shippingAddress.city}, {result.shippingAddress.state}
                    </p>
                  </div>
                  {ORDER_STATUS_CONFIG[result.status] && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        color: ORDER_STATUS_CONFIG[result.status].color,
                        backgroundColor: ORDER_STATUS_CONFIG[result.status].bgColor,
                      }}
                    >
                      {ORDER_STATUS_CONFIG[result.status].icon} {ORDER_STATUS_CONFIG[result.status].label}
                    </span>
                  )}
                </div>

                {result.trackingInfo?.trackingNumber && (
                  <div className="p-4 bg-surface rounded-xl text-sm space-y-1.5">
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <Truck className="w-4 h-4 text-primary" />
                      Shipping Details
                    </p>
                    <p><span className="text-muted-foreground">Courier:</span> {result.trackingInfo.courier}</p>
                    <p><span className="text-muted-foreground">Tracking #:</span> {result.trackingInfo.trackingNumber}</p>
                    {result.trackingInfo.expectedDelivery && (
                      <p>
                        <span className="text-muted-foreground">Expected Delivery:</span>{' '}
                        {formatDate(result.trackingInfo.expectedDelivery)}
                      </p>
                    )}
                    {result.trackingInfo.trackingUrl && (
                      <a
                        href={result.trackingInfo.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Track on courier website →
                      </a>
                    )}
                  </div>
                )}

                {result.status === 'delivered' ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Your order has been delivered!
                  </div>
                ) : result.status === 'cancelled' ? (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <Clock className="w-4 h-4" />
                    This order was cancelled.
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Our team is actively processing your order. You&apos;ll receive updates via email.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ContentPage>
  );
}

