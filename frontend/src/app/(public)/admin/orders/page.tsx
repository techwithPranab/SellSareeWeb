'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice, formatDate, formatPaymentMethod, asRoute } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { Order, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import Select from 'react-select';
import type { User } from '@/types';

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Return Requested', value: 'return_requested' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({ page, limit: 15, status: status || undefined, search: debouncedSearch || undefined, customerId: customerId || undefined, paymentStatus: paymentStatus || undefined, paymentMethod: paymentMethod || undefined, from: from || undefined, to: to || undefined });
      setOrders(res.data ?? []);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [customerId, debouncedSearch, from, page, paymentMethod, paymentStatus, status, to]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    adminService.getCustomers({ page: 1, limit: 100, role: 'customer' })
      .then((response) => setCustomers(response.data ?? []))
      .catch(() => toast.error('Could not load customers for filtering'));
  }, []);

  const customerOptions = customers.map((customer) => ({ value: customer._id, label: `${customer.name} — ${customer.phone || customer.email}` }));

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="View and manage all customer orders"
        action={
          <Link href={asRoute('/admin/orders/new')} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create WhatsApp Order
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                status === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:border-primary text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="border-b border-border bg-surface/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className="relative"><Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search order number…" className="input-field py-2 pl-9 text-sm" /></div>
            <Select options={customerOptions} value={customerOptions.find((option) => option.value === customerId) || null} onChange={(option) => { setCustomerId(option?.value || ''); setPage(1); }} isClearable isSearchable placeholder="Search customer…" noOptionsMessage={() => 'No customers found'} instanceId="admin-order-customer-filter" className="text-sm" styles={{ control: (base) => ({ ...base, minHeight: 42, borderColor: '#e8d5c4', borderRadius: 8, boxShadow: 'none' }), menu: (base) => ({ ...base, zIndex: 30 }) }} />
            <select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }} className="input-field py-2 text-sm" aria-label="Payment status"><option value="">All payment statuses</option><option value="pending">Payment pending</option><option value="processing">Payment processing</option><option value="completed">Paid</option><option value="failed">Payment failed</option><option value="refunded">Refunded</option><option value="partially_refunded">Partially refunded</option></select>
            <select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setPage(1); }} className="input-field py-2 text-sm" aria-label="Payment method"><option value="">All payment methods</option><option value="upi">UPI</option><option value="razorpay">Razorpay</option><option value="wallet">Wallet</option></select>
            <div><label className="sr-only" htmlFor="order-from">From date</label><input id="order-from" type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="input-field py-2 text-sm" title="From date" /></div>
            <div><label className="sr-only" htmlFor="order-to">To date</label><input id="order-to" type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="input-field py-2 text-sm" title="To date" /></div>
          </div>
          {(search || customerId || paymentStatus || paymentMethod || from || to) && <button type="button" onClick={() => { setSearch(''); setCustomerId(''); setPaymentStatus(''); setPaymentMethod(''); setFrom(''); setTo(''); setPage(1); }} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><X className="h-3.5 w-3.5" />Clear additional filters</button>}
        </div>

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading orders…" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Total Sarees</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const config = ORDER_STATUS_CONFIG[order.status];
                  const customer = typeof order.user === 'object' ? order.user : null;
                  return (
                    <tr key={order._id} className="hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <Link href={asRoute(`/admin/orders/${order._id}`)} className="font-medium text-primary hover:underline">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{customer?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{customer?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 font-medium">{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        {config && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ color: config.color, backgroundColor: config.bgColor }}
                          >
                            {config.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatPaymentMethod(order.paymentInfo.method)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 pb-4">
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
