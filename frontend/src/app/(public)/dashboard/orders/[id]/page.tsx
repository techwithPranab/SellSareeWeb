'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronLeft, Truck, XCircle, RotateCcw, AlertCircle, CornerUpLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchOrderById, cancelOrder, requestReturnOrder } from '@/features/orders/ordersSlice';
import {
  formatPrice,
  formatDate,
  formatPaymentMethod,
  getOrderTrackingSteps,
  generateWhatsAppOrderMessage,
} from '@/utils/helpers';
import { ORDER_STATUS_CONFIG, WHATSAPP_NUMBER, RETURN_REASONS } from '@/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentOrder: order, isLoading } = useAppSelector((s) => s.orders);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    const result = await dispatch(cancelOrder({ orderId: order._id, reason: 'Customer requested cancellation' }));
    if (cancelOrder.fulfilled.match(result)) {
      toast.success('Order cancelled successfully');
    } else {
      toast.error((result.payload as string) || 'Failed to cancel order');
    }
    setCancelling(false);
  };

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [comments, setComments] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingReturn(true);
    const reasonText = selectedReason === 'Other' && comments ? `Other: ${comments}` : selectedReason + (comments ? ` - ${comments}` : '');
    const result = await dispatch(requestReturnOrder({ orderId: order._id, reason: reasonText }));
    if (requestReturnOrder.fulfilled.match(result)) {
      toast.success('Return request submitted successfully');
      setShowReturnModal(false);
    } else {
      toast.error((result.payload as string) || 'Failed to submit return request');
    }
    setSubmittingReturn(false);
  };

  if (isLoading || !order) {
    return <LoadingSpinner fullPage label="Loading order…" />;
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const trackingSteps = getOrderTrackingSteps(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canReturn = order.status === 'delivered' && order.isReturnable && order.isReturnWindowOpen;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-foreground">
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        {statusConfig && (
          <span
            className="text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
          >
            {statusConfig.icon} {statusConfig.label}
          </span>
        )}
      </div>

      {/* Tracking */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          Order Tracking
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
          {trackingSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex sm:flex-col items-center gap-2 sm:text-center sm:flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    step.completed ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.icon}
                </div>
                <p className={`text-xs font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </div>
              {i < trackingSteps.length - 1 && (
                <div className={`hidden sm:block flex-1 h-0.5 mx-2 ${step.completed ? 'bg-primary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        {order.trackingInfo?.trackingNumber && (
          <div className="mt-5 p-4 bg-surface rounded-xl text-sm">
            <p><span className="text-muted-foreground">Courier:</span> {order.trackingInfo.courier}</p>
            <p><span className="text-muted-foreground">Tracking #:</span> {order.trackingInfo.trackingNumber}</p>
            {order.trackingInfo.expectedDelivery && (
              <p><span className="text-muted-foreground">Expected:</span> {formatDate(order.trackingInfo.expectedDelivery)}</p>
            )}
          </div>
        )}
      </div>

      {order.returnReason && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-orange-800 font-semibold">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            Return Requested
          </div>
          <p className="text-sm text-orange-700">
            <span className="font-semibold text-orange-800">Reason:</span> {order.returnReason}
          </p>
          {order.returnRequestedAt && (
            <p className="text-xs text-orange-500">
              Submitted on {formatDate(order.returnRequestedAt)}
            </p>
          )}
          <div className="text-xs text-orange-600 bg-orange-100/50 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Our courier partner will contact you within 2-3 business days to pick up the return package. Please ensure all original tags are intact and the saree is in unused condition.</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item._id} className="flex gap-4">
              <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-surface shrink-0">
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity} · SKU: {item.sku}</p>
              </div>
              <p className="font-semibold text-foreground">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-3">Shipping Address</h2>
          <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-3">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(order.shippingCharge)}</span></div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(order.couponDiscount)}</span></div>
            )}
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Total</span><span className="text-primary">{formatPrice(order.totalAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Paid via {formatPaymentMethod(order.paymentInfo.method)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-outline btn-sm flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Cancel Order
          </button>
        )}
        {canReturn && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="btn-outline btn-sm flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
          >
            <RotateCcw className="w-4 h-4" />
            Request Return
          </button>
        )}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${generateWhatsAppOrderMessage(order)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline btn-sm"
        >
          Need Help? WhatsApp Us
        </a>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-lg">
              <RotateCcw className="w-5 h-5" />
              Request Saree Return
            </div>
            <p className="text-xs text-muted-foreground">
              Please select a reason for returning this item. Saree must be in its original packaging with all tags attached.
            </p>
            
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reason for Return
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="input-field text-sm"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Additional Details {['Other', 'Product not as described', 'Quality not as expected'].includes(selectedReason) && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us more about the issue…"
                  required={['Other', 'Product not as described', 'Quality not as expected'].includes(selectedReason)}
                  rows={3}
                  className="input-field text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  disabled={submittingReturn}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn-primary btn-sm flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {submittingReturn && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
