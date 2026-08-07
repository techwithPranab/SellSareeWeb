'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Users, ShoppingBag, TrendingUp, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { formatPrice, asRoute } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { DashboardStats } from '@/types';
import type { ProductStats } from '@/services/admin.service';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const QUICK_LINKS = [
  { href: '/admin/products/new', label: 'Add Product', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Manage Orders', icon: Package },
  { href: '/admin/coupons', label: 'Create Coupon', icon: TrendingUp },
  { href: '/admin/reviews', label: 'Moderate Reviews', icon: Users },
];

export default function AdminDashboardPage() {
  const [orderStats, setOrderStats] = useState<DashboardStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getOrderStats().catch(() => null),
      adminService.getProductStats().catch(() => null),
    ]).then(([orders, products]) => {
      setOrderStats(orders);
      setProductStats(products);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;

  const statCards = [
    { label: "Today's Revenue", value: formatPrice(orderStats?.todayRevenue ?? 0), icon: IndianRupee, color: 'text-green-600 bg-green-50' },
    { label: "Today's Orders", value: orderStats?.todayOrders ?? 0, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Monthly Revenue', value: formatPrice(orderStats?.monthlyRevenue ?? 0), icon: TrendingUp, color: 'text-primary bg-primary/10' },
    { label: 'Total Orders', value: orderStats?.totalOrders ?? 0, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Active Products', value: productStats?.activeProducts ?? 0, icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
    { label: 'Out of Stock', value: productStats?.outOfStock ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={asRoute(link.href)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <link.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Order Status</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {orderStats?.statusDistribution?.length ? (
            <div className="space-y-3">
              {orderStats.statusDistribution.map((item) => {
                const config = ORDER_STATUS_CONFIG[item._id];
                return (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-foreground flex items-center gap-2">
                      {config?.icon} {config?.label ?? item._id.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold bg-surface px-3 py-1 rounded-full">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No order data yet.</p>
          )}
        </div>
      </div>

      {productStats && productStats.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700">{productStats.lowStockCount} product(s) have 5 or fewer units left.</p>
          </div>
          <Link href="/admin/products" className="btn-outline btn-sm shrink-0">View Products</Link>
        </div>
      )}
    </div>
  );
}
