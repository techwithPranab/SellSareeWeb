'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, RotateCcw, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice, formatDate } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

// Statuses the admin can manually set
const ADMIN_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refund_initiated',
  'refunded',
];

// Statuses where return context is relevant
const RETURN_STATUSES: OrderStatus[] = [
  'return_requested',
  'returned',
  'refund_initiated',
  'refunded',
];

// Statuses where admin can trigger a Razorpay refund
const REFUNDABLE_STATUSES: OrderStatus[] = ['return_requested', 'returned', 'refund_initiated'];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [initiatingRefund, setInitiatingRefund] = useState(false);

  useEffect(() => {
    if (id) {
      adminService
        .getOrder(id)
        .then((res) => {
          setOrder(res.order);
          setNewStatus(res.order.status);
          setCourier(res.order.trackingInfo?.courier ?? '');
          setTrackingNumber(res.order.trackingInfo?.trackingNumber ?? '');
          setRefundAmount(res.order.totalAmount);
        })
        .catch(() => toast.error('Failed to load order'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!id || !order) return;
    setUpdating(true);
    try {
      const trackingInfo =
        ['shipped', 'out_for_delivery'].includes(newStatus) && trackingNumber
          ? { courier, trackingNumber, trackingUrl: '' }
          : undefined;
      const { order: updated } = await adminService.updateOrderStatus(id, newStatus, trackingInfo);
      setOrder(updated);
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!refundAmount || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (refundAmount > order.totalAmount) {
      toast.error(`Refund amount cannot exceed order total of ${formatPrice(order.totalAmount)}`);
      return;
    }
    // Only online payments can be refunded via Razorpay
    if (order.paymentInfo.method === 'cod') {
      toast.error('COD orders require manual refund processing');
      return;
    }
    setInitiatingRefund(true);
    try {
      await adminService.initiateRefund(order._id, refundAmount);
      // Update local state to reflect refund_initiated
      setOrder((prev) => prev ? { ...prev, status: 'refund_initiated' } : prev);
      setNewStatus('refund_initiated');
      toast.success('Refund initiated successfully via Razorpay');
      setShowRefundModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to initiate refund');
    } finally {
      setInitiatingRefund(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading order…" />;
  if (!order) return <p className="text-muted-foreground">Order not found.</p>;

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const customer = typeof order.user === 'object' ? order.user : null;
  const isReturnContext = RETURN_STATUSES.includes(order.status);
  const canRefund =
    REFUNDABLE_STATUSES.includes(order.status) && order.paymentInfo.method !== 'cod';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order #${order.orderNumber}`}
        backHref="/admin/orders"
        description={`Placed on ${formatDate(order.createdAt)}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <div className="relative w-14 h-[72px] rounded-lg overflow-hidden bg-surface shrink-0">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} · {item.sku}</p>
                    {item.color && (
                      <p className="text-xs text-muted-foreground">Colour: {item.color}</p>
                    )}
                  </div>
                  <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Details Card — visible when status is return-related */}
          {isReturnContext && order.returnReason && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-orange-800 font-semibold">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                Customer Return Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-orange-500 mb-0.5">Return Reason</p>
                  <p className="font-medium text-orange-800">{order.returnReason}</p>
                </div>
                {order.returnRequestedAt && (
                  <div>
                    <p className="text-xs text-orange-500 mb-0.5">Requested On</p>
                    <p className="font-medium text-orange-800">{formatDate(order.returnRequestedAt)}</p>
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <p className="text-xs text-orange-500 mb-0.5">Delivered On</p>
                    <p className="font-medium text-orange-800">{formatDate(order.deliveredAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-orange-500 mb-0.5">Return Window</p>
                  <p className="font-medium text-orange-800">{order.returnWindowDays} days</p>
                </div>
              </div>

              {canRefund && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Initiate Razorpay Refund
                  </button>
                </div>
              )}

              {order.status === 'refund_initiated' && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Refund has been initiated. Amount will be credited to the customer within 5–7 business days.
                </div>
              )}
              {order.status === 'refunded' && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Refund completed.
                </div>
              )}
            </div>
          )}

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-3">Shipping Address</h2>
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Status updater */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Update Status</h2>

            {statusConfig && (
              <div className="mb-4">
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
                >
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="input-field py-2 text-sm"
              >
                {ADMIN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_CONFIG[s]?.icon} {ORDER_STATUS_CONFIG[s]?.label ?? s}
                  </option>
                ))}
              </select>

              {/* Tracking fields for shipped/out-for-delivery */}
              {['shipped', 'out_for_delivery'].includes(newStatus) && (
                <>
                  <input
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="Courier name (e.g. Delhivery)"
                    className="input-field py-2 text-sm"
                  />
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking number"
                    className="input-field py-2 text-sm"
                  />
                </>
              )}

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="btn-primary w-full btn-sm flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Status
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-3">Summary</h2>

            {customer && (
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.shippingCharge)}</span>
              </div>
              {order.codCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Charges</span>
                  <span>{formatPrice(order.codCharges)}</span>
                </div>
              )}
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.couponCode})</span>
                  <span>−{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.totalAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1 capitalize">
                Payment: {order.paymentInfo.method} ·{' '}
                <span
                  style={{
                    color:
                      order.paymentInfo.status === 'completed'
                        ? '#10b981'
                        : order.paymentInfo.status === 'failed'
                        ? '#ef4444'
                        : '#f59e0b',
                  }}
                >
                  {order.paymentInfo.status}
                </span>
              </p>
              {order.loyaltyPointsEarned > 0 && (
                <p className="text-xs text-muted-foreground">
                  Loyalty points earned: <span className="font-semibold text-primary">{order.loyaltyPointsEarned} pts</span>
                </p>
              )}
            </div>

            {/* Quick refund trigger if COD return */}
            {isReturnContext && order.paymentInfo.method === 'cod' && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This is a COD order. Refund must be processed manually (bank transfer / store credit).</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-2">Customer Notes</h2>
              <p className="text-sm text-muted-foreground italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Refund Modal ── */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-lg">
              <CreditCard className="w-5 h-5" />
              Initiate Refund
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Order: <span className="font-semibold text-foreground">#{order.orderNumber}</span></p>
              <p>Order Total: <span className="font-semibold text-foreground">{formatPrice(order.totalAmount)}</span></p>
            </div>

            <form onSubmit={handleInitiateRefund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Refund Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={order.totalAmount}
                  step={1}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="input-field text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max refundable: {formatPrice(order.totalAmount)}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This will immediately trigger a refund via Razorpay. This action cannot be undone. Ensure the return has been physically received before proceeding.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  disabled={initiatingRefund}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiatingRefund}
                  className="btn-primary btn-sm flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {initiatingRefund && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
