'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, RotateCcw, CreditCard, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { adminService, type GiftItem, type StoreSettings } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice, formatDate, formatPaymentMethod } from '@/utils/helpers';
import { APP_URL, ORDER_STATUS_CONFIG } from '@/constants';
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

const LABEL_STATUSES: OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
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
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [savingPartialPayment, setSavingPartialPayment] = useState(false);
  const [markingUnpaid, setMarkingUnpaid] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ amount: 0, paidAt: new Date().toISOString().slice(0, 10), reference: '', note: '' });
  const [giftInventory, setGiftInventory] = useState<GiftItem[]>([]);
  const [giftQuantities, setGiftQuantities] = useState<Record<string, number>>({});
  const [savingGifts, setSavingGifts] = useState(false);

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
          setGiftQuantities(Object.fromEntries((res.order.giftItems || []).map((item) => [item.giftItem, item.quantity])));
        })
        .catch(() => toast.error('Failed to load order'))
        .finally(() => setLoading(false));
    }
    adminService.getStoreSettings()
      .then(({ settings }) => setStoreSettings(settings))
      .catch(() => toast.error('Failed to load store settings for the dispatch label'));
    adminService.getGiftItems(true).then(({ items }) => setGiftInventory(items)).catch(() => toast.error('Failed to load gift inventory'));
  }, [id]);

  const handleSaveGifts = async () => {
    if (!order) return;
    setSavingGifts(true);
    try {
      const giftItems = Object.entries(giftQuantities).filter(([, quantity]) => quantity > 0).map(([giftItemId, quantity]) => ({ giftItemId, quantity }));
      const { order: updated } = await adminService.updateOrderGiftItems(order._id, giftItems);
      setOrder(updated);
      setGiftQuantities(Object.fromEntries((updated.giftItems || []).map((item) => [item.giftItem, item.quantity])));
      setGiftInventory((await adminService.getGiftItems(true)).items);
      toast.success('Gift items updated');
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not update gift items');
    } finally { setSavingGifts(false); }
  };

  const handleUpdateStatus = async () => {
    if (!id || !order) return;
    setUpdating(true);
    try {
      const trackingInfo =
        ['shipped', 'out_for_delivery'].includes(newStatus) && (trackingNumber || courier)
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
    if (order.paymentInfo.method !== 'razorpay') {
      toast.error('Only Razorpay payments can be refunded through the payment gateway');
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

  const handleConfirmManualPayment = async () => {
    if (!order) return;
    if (!window.confirm('Confirm that payment has been received for this order? This amount will be included in revenue.')) return;
    setConfirmingPayment(true);
    try {
      const { order: updated } = await adminService.confirmManualPayment(order._id);
      setOrder(updated);
      setNewStatus(updated.status);
      toast.success('Payment marked as paid and included in revenue');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to confirm payment');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!order || paymentDraft.amount <= 0) return toast.error('Enter a payment amount greater than zero');
    setSavingPartialPayment(true);
    try {
      const { order: updated } = await adminService.recordManualPayment(order._id, paymentDraft);
      setOrder(updated); setNewStatus(updated.status);
      setPaymentDraft({ amount: 0, paidAt: new Date().toISOString().slice(0, 10), reference: '', note: '' });
      toast.success('Payment recorded');
    } catch (error: unknown) { toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not record payment'); }
    finally { setSavingPartialPayment(false); }
  };

  const handleMarkUnpaid = async () => {
    if (!order || !confirm('Mark this order as unpaid? Active manual payment records will be voided but retained in history.')) return;
    setMarkingUnpaid(true);
    try { const { order: updated } = await adminService.markOrderUnpaid(order._id); setOrder(updated); toast.success('Order marked as unpaid'); }
    catch (error: unknown) { toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not mark order unpaid'); }
    finally { setMarkingUnpaid(false); }
  };

  const handlePrintDocument = (isInvoice = false) => {
    if (!order) return;
    if (!storeSettings) {
      toast.error('Store settings are still loading. Please try printing again.');
      return;
    }

    const labelWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!labelWindow) {
      toast.error(`Please allow pop-ups to print the ${isInvoice ? 'invoice' : 'dispatch label'}`);
      return;
    }
    labelWindow.opener = null;

    const documentTitle = isInvoice ? 'Invoice' : 'Dispatch Label';
    const couponCodes = order.couponCodes?.length ? order.couponCodes.join(', ') : order.couponCode;
    const couponDiscount = order.couponDiscount || 0;
    const totalDiscount = Math.max(order.discount || 0, couponDiscount);
    const otherDiscount = Math.max(0, totalDiscount - couponDiscount);
    const amount = (value: number) => escapeHtml(formatPrice(value));
    const invoiceSummary = isInvoice ? `
      <section class="invoice-summary">
        <div><span>Subtotal</span><span>${amount(order.subtotal)}</span></div>
        <div><span>Shipping</span><span>${amount(order.shippingCharge)}</span></div>
        ${order.taxAmount > 0 ? `<div><span>Tax</span><span>${amount(order.taxAmount)}</span></div>` : ''}
        ${couponCodes || couponDiscount > 0 ? `<div><span>Coupon discount${couponCodes ? `<br><small>Applied codes: ${escapeHtml(couponCodes)}</small>` : ''}</span><span>−${amount(couponDiscount)}</span></div>` : ''}
        ${otherDiscount > 0 ? `<div><span>${order.loyaltyPointsRedeemed > 0 ? `Loyalty discount (${order.loyaltyPointsRedeemed} points)` : 'Other discount'}</span><span>−${amount(otherDiscount)}</span></div>` : ''}
        ${totalDiscount > 0 ? `<div class="discount-total"><strong>Total discounts</strong><strong>−${amount(totalDiscount)}</strong></div>` : ''}
        <div class="grand-total"><strong>Order total</strong><strong>${amount(order.totalAmount)}</strong></div>
        <p class="muted">Payment: ${escapeHtml(formatPaymentMethod(order.paymentInfo.method))} · ${escapeHtml(order.paymentInfo.status)}</p>
      </section>
    ` : '';
    const address = order.shippingAddress;
    const senderAddress = escapeHtml(storeSettings.storeAddress || 'Sender address not configured')
      .replace(/\r?\n/g, '<br>');
    const qrCodeUrl = `${window.location.origin}/images/qrcode_docs.google.com.png`;
    const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
    const itemRows = order.items.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}${item.color ? `<br><small>Colour: ${escapeHtml(item.color)}</small>` : ''}</td>
        <td>${escapeHtml(item.sku)}</td>
        <td class="center">${item.quantity}</td>
        ${isInvoice ? `<td class="money">${amount(item.price)}</td><td class="money">${amount(item.subtotal)}</td>` : ''}
      </tr>
    `).join('');

    labelWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle} - ${escapeHtml(order.orderNumber)}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { width: 210mm; min-height: 99mm; }
            body { margin: 0; padding: 4mm; color: #111; font-family: Arial, sans-serif; }
            .label { width: 202mm; margin: 0 auto; border: 1.5px solid #111; }
            .row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #111; }
            .cell { padding: 2.5mm; font-size: 11px; }
            .cell + .cell { border-left: 1px solid #111; }
            .brand { font-size: 17px; font-weight: 700; }
            .muted { color: #444; font-size: 9px; line-height: 1.4; }
            .title { margin-bottom: 1.5mm; font-size: 9px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
            .recipient { display: flex; align-items: center; justify-content: space-between; gap: 5mm; padding: 3mm; border-bottom: 1px solid #111; font-size: 12px; line-height: 1.4; }
            .recipient-address { min-width: 0; flex: 1; }
            .recipient strong { font-size: 16px; }
            .phone { margin-top: 1.5mm; font-size: 13px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 2mm 2.5mm; border-bottom: 1px solid #bbb; text-align: left; }
            td small { font-size: 9px; }
            th { background: #f2f2f2; }
            .center { text-align: center; }
            .footer { padding: 2mm 3mm; font-size: 9px; color: #444; }
            .feedback-qr { flex: 0 0 auto; text-align: center; }
            .qr-code { width: 30mm; height: 30mm; object-fit: contain; border: 1px solid #bbb; padding: 1mm; }
            .qr-caption { margin-top: 1mm; max-width: 34mm; font-size: 9px; font-weight: 700; line-height: 1.2; }
            .money { text-align: right; white-space: nowrap; }
            .invoice-summary { margin: 4mm 3mm 4mm auto; width: 100mm; font-size: 11px; }
            .invoice-summary > div { display: flex; justify-content: space-between; gap: 4mm; padding: 1.5mm 0; }
            .invoice-summary > div > span:last-child { white-space: nowrap; }
            .invoice-summary small { display: block; overflow-wrap: anywhere; font-size: 9px; }
            .discount-total { border-top: 1px solid #bbb; }
            .grand-total { border-top: 1.5px solid #111; font-size: 14px; }
            thead { display: table-header-group; }
            tr, .invoice-summary { break-inside: avoid; }
            @page { size: ${isInvoice ? 'A4' : '210mm 99mm'}; margin: 4mm; }
            @media print {
              html, body { width: 202mm; min-height: auto; }
              body { padding: 0; }
              .label { width: 202mm; break-inside: ${isInvoice ? 'auto' : 'avoid'}; }
            }
          </style>
        </head>
        <body>
          <main class="label">
            <div class="row">
              <div class="cell">
                <div class="brand">${escapeHtml(storeSettings.storeName || 'PP’s Aura')}</div>
                <div class="muted">${senderAddress}${storeSettings.supportEmail ? `<br>${escapeHtml(storeSettings.supportEmail)}` : ''}${storeSettings.supportPhone ? ` · ${escapeHtml(storeSettings.supportPhone)}` : ''}<br>Website: ${escapeHtml(APP_URL)}</div>
              </div>
              <div class="cell">
                <div class="title">${isInvoice ? 'Invoice / Order' : 'Order'}</div>
                <strong>#${escapeHtml(order.orderNumber)}</strong><br>
                <span class="muted">Placed: ${escapeHtml(formatDate(order.createdAt))}<br>Packages: 1 · Items: ${itemCount}</span>
              </div>
            </div>
            <section class="recipient">
              <div class="recipient-address">
                <div class="title">Deliver To</div>
                <strong>${escapeHtml(address.fullName)}</strong><br>
                ${escapeHtml(address.addressLine1)}${address.addressLine2 ? `<br>${escapeHtml(address.addressLine2)}` : ''}<br>
                ${escapeHtml(address.city)}, ${escapeHtml(address.state)} - <strong>${escapeHtml(address.pincode)}</strong><br>
                ${escapeHtml(address.country || 'India')}
                <div class="phone">Phone: ${escapeHtml(address.phone)}</div>
              </div>
              <div class="feedback-qr">
                <img id="order-qr-code" class="qr-code" src="${escapeHtml(qrCodeUrl)}" alt="PP’s Aura feedback QR code" />
                <div class="qr-caption">Scan to submit feedback</div>
              </div>
            </section>
            ${(order.trackingInfo?.courier || order.trackingInfo?.trackingNumber) ? `
              <div class="row">
                <div class="cell"><div class="title">Courier</div>${escapeHtml(order.trackingInfo?.courier || '—')}</div>
                <div class="cell"><div class="title">Tracking Number</div>${escapeHtml(order.trackingInfo?.trackingNumber || '—')}</div>
              </div>
            ` : ''}
            <table>
              <thead><tr><th>Item</th><th>SKU</th><th class="center">Qty</th>${isInvoice ? '<th class="money">Unit price</th><th class="money">Amount</th>' : ''}</tr></thead>
              <tbody>${itemRows}</tbody>
            </table>
            ${invoiceSummary}
            ${!isInvoice && order.notes ? `<div class="footer"><strong>Dispatch note:</strong> ${escapeHtml(order.notes)}</div>` : ''}
          </main>
        </body>
      </html>`);
    labelWindow.document.close();
    const qrImage = labelWindow.document.getElementById('order-qr-code') as HTMLImageElement | null;
    let printStarted = false;
    const startPrint = () => {
      if (printStarted) return;
      printStarted = true;
      labelWindow.focus();
      labelWindow.print();
    };
    if (!qrImage || qrImage.complete) startPrint();
    else {
      qrImage.onload = startPrint;
      qrImage.onerror = startPrint;
      labelWindow.setTimeout(startPrint, 2000);
    }
  };

  if (loading) return <LoadingSpinner label="Loading order…" />;
  if (!order) return <p className="text-muted-foreground">Order not found.</p>;

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const customer = typeof order.user === 'object' ? order.user : null;
  const isReturnContext = RETURN_STATUSES.includes(order.status);
  const canRefund =
    REFUNDABLE_STATUSES.includes(order.status) && order.paymentInfo.method === 'razorpay';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order #${order.orderNumber}`}
        backHref="/admin/orders"
        description={`Placed on ${formatDate(order.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handlePrintDocument(true)} className="btn-outline btn-sm inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            {LABEL_STATUSES.includes(order.status) && (
              <button onClick={() => handlePrintDocument()} className="btn-primary btn-sm inline-flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print / Download Label
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Items */}
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
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

          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-foreground">Gift Items</h2><p className="mt-1 text-xs text-muted-foreground">Included free with this order</p></div></div>
            {['pending', 'confirmed', 'processing'].includes(order.status) ? <div className="space-y-3">{giftInventory.length === 0 ? <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">No active gift inventory is available.</p> : giftInventory.map((gift) => { const assigned = giftQuantities[gift._id] || 0; return <div key={gift._id} className="flex items-center gap-3 rounded-xl border border-border p-3"><div className="min-w-0 flex-1"><p className="font-medium">{gift.name}</p><p className="text-xs text-muted-foreground">{gift.sku} · {gift.stock} available{assigned ? ` + ${assigned} assigned` : ''}</p></div><input type="number" min="0" max={gift.stock + assigned} value={assigned} onChange={(event) => setGiftQuantities((current) => ({ ...current, [gift._id]: Math.max(0, Number(event.target.value) || 0) }))} className="input-field w-24 py-2 text-center" aria-label={`Quantity of ${gift.name}`} /></div>; })}<button type="button" onClick={handleSaveGifts} disabled={savingGifts} className="btn-primary btn-sm">{savingGifts ? 'Saving…' : 'Save Gift Items'}</button></div> : (order.giftItems || []).length ? <div className="space-y-2">{order.giftItems!.map((gift) => <div key={gift.giftItem} className="flex justify-between rounded-lg bg-surface px-3 py-2 text-sm"><span>{gift.name} <span className="text-muted-foreground">({gift.sku})</span></span><span className="font-semibold">× {gift.quantity}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No gift items assigned.</p>}
          </div>

          {/* Return Details Card — visible when status is return-related */}
          {isReturnContext && order.returnReason && (
            <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-6">
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
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
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
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
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
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
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
                Payment: {formatPaymentMethod(order.paymentInfo.method)} ·{' '}
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
              {order.paymentInfo.manualTransactionId && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Transaction ID / UTR</p>
                  <p className="break-all font-mono text-sm font-semibold">{order.paymentInfo.manualTransactionId}</p>
                </div>
              )}
              {order.paymentInfo.paymentScreenshot && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-muted-foreground">Payment Screenshot</p>
                  <a href={order.paymentInfo.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-border">
                    <Image src={order.paymentInfo.paymentScreenshot} alt={`Payment proof for order ${order.orderNumber}`} width={420} height={260} className="h-auto w-full object-contain" />
                  </a>
                </div>
              )}
              {order.paymentInfo.method === 'upi' && ['pending', 'processing'].includes(order.paymentInfo.status) && (
                <button
                  type="button"
                  onClick={handleConfirmManualPayment}
                  disabled={confirmingPayment}
                  className="btn-primary mt-2 inline-flex w-full items-center justify-center gap-2"
                >
                  {confirmingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {order.paymentInfo.status === 'processing' ? 'Confirm QR Payment' : 'Mark Payment as Paid'}
                </button>
              )}
              {order.paymentInfo.method === 'upi' && <div className="mt-4 space-y-3 border-t border-border pt-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Manual Payment Log</p>{order.paymentInfo.status !== 'pending' && <button type="button" onClick={handleMarkUnpaid} disabled={markingUnpaid} className="text-xs font-medium text-red-600 hover:underline">{markingUnpaid ? 'Updating…' : 'Mark Unpaid'}</button>}</div>{(order.paymentInfo.manualPayments || []).length > 0 && <div className="max-h-40 space-y-2 overflow-auto">{order.paymentInfo.manualPayments!.map((payment, index) => <div key={payment._id || index} className={`rounded-lg p-2 text-xs ${payment.voidedAt ? 'bg-gray-100 text-muted-foreground line-through' : 'bg-green-50 text-green-800'}`}><div className="flex justify-between"><span>{new Date(payment.paidAt).toLocaleDateString('en-IN')}</span><strong>{formatPrice(payment.amount)}</strong></div>{payment.reference && <p>Ref: {payment.reference}</p>}{payment.note && <p>{payment.note}</p>}{payment.voidedAt && <p className="no-underline">Voided</p>}</div>)}</div>}<div className="grid grid-cols-2 gap-2"><input type="number" min="0.01" step="0.01" value={paymentDraft.amount || ''} onChange={(e) => setPaymentDraft({ ...paymentDraft, amount: Number(e.target.value) })} placeholder="Amount" className="input-field py-2 text-sm" /><input type="date" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })} className="input-field py-2 text-sm" /><input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })} placeholder="Reference / UTR" className="input-field col-span-2 py-2 text-sm" /><input value={paymentDraft.note} onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })} placeholder="Note (optional)" className="input-field col-span-2 py-2 text-sm" /></div><button type="button" onClick={handleRecordPayment} disabled={savingPartialPayment || paymentDraft.amount <= 0} className="btn-outline btn-sm w-full">{savingPartialPayment ? 'Recording…' : 'Record Payment'}</button></div>}
              {order.loyaltyPointsEarned > 0 && (
                <p className="text-xs text-muted-foreground">
                  Loyalty points earned: <span className="font-semibold text-primary">{order.loyaltyPointsEarned} pts</span>
                </p>
              )}
            </div>

            {isReturnContext && order.paymentInfo.method !== 'razorpay' && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This manually collected payment must be refunded outside the payment gateway.</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
              <h2 className="font-semibold text-foreground mb-2">Customer Notes</h2>
              <p className="text-sm text-muted-foreground italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Refund Modal ── */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="max-h-[95dvh] w-full max-w-sm space-y-4 overflow-y-auto rounded-t-2xl border border-border bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
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

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
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
