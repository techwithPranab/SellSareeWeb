'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchUserOrders } from '@/features/orders/ordersSlice';
import { formatPrice, formatDate } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchUserOrders({ limit: 50 }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage all your orders</p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading orders…" />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Package className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">No orders yet</h2>
          <p className="text-muted-foreground text-sm mb-6">When you place an order, it will appear here.</p>
          <Link href="/products" className="btn-primary btn-sm">Browse Sarees</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status];
            return (
              <Link
                key={order._id}
                href={`/dashboard/orders/${order._id}`}
                className="block bg-white rounded-2xl border border-border p-5 hover:shadow-card transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground">Order #{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item(s) · {order.paymentInfo.method.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">{formatPrice(order.totalAmount)}</p>
                    {statusConfig && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-block"
                        style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
