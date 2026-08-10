'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice, formatDate, asRoute } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { Order, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

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
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({ page, limit: 15, status: status || undefined });
      setOrders(res.data ?? []);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

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

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading orders…" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
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
                      <td className="px-4 py-3">{order.items.length}</td>
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
                      <td className="px-4 py-3 capitalize text-muted-foreground">{order.paymentInfo.method}</td>
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
