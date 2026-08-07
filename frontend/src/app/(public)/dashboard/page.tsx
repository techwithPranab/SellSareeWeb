'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Package, Heart, Star, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchUserOrders } from '@/features/orders/ordersSlice';
import { selectWishlistIds } from '@/features/wishlist/wishlistSlice';
import { formatPrice, formatDate } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((s) => s.orders);
  const wishlistCount = useAppSelector((s) => selectWishlistIds(s).length);

  useEffect(() => {
    dispatch(fetchUserOrders({ limit: 5 }));
  }, [dispatch]);

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">Manage your orders, wishlist, and account settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Total Orders', value: orders.length, href: '/dashboard/orders', color: 'text-blue-600 bg-blue-50' },
          { icon: Heart, label: 'Wishlist', value: wishlistCount, href: '/dashboard/wishlist', color: 'text-red-600 bg-red-50' },
          { icon: Star, label: 'Loyalty Points', value: user?.loyaltyPoints ?? 0, href: '/dashboard', color: 'text-amber-600 bg-amber-50' },
          { icon: Gift, label: 'Referral Code', value: user?.referralCode ?? '—', href: '/dashboard/profile', color: 'text-green-600 bg-green-50', isCode: true },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl border border-border p-5 hover:shadow-card transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`font-bold text-foreground mt-0.5 ${stat.isCode ? 'text-sm font-mono' : 'text-2xl'}`}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg text-foreground">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading orders…" />
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No orders yet.</p>
            <Link href="/products" className="btn-primary btn-sm mt-4 inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status];
              return (
                <Link
                  key={order._id}
                  href={`/dashboard/orders/${order._id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt)} · {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatPrice(order.totalAmount)}</p>
                    {statusConfig && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ color: statusConfig.color, backgroundColor: statusConfig.bgColor }}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
