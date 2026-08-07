'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { DashboardStats } from '@/types';
import type { ProductStats } from '@/services/admin.service';

const PIE_COLORS = ['#b5451b', '#c8813a', '#3d6b4f', '#6b2fa0', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];

export default function AdminAnalyticsPage() {
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

  if (loading) return <LoadingSpinner label="Loading analytics…" />;

  const statusData = (orderStats?.statusDistribution ?? []).map((item) => ({
    name: ORDER_STATUS_CONFIG[item._id]?.label ?? item._id.replace(/_/g, ' '),
    value: item.count,
  }));

  const revenueData = [
    { name: 'Today', revenue: orderStats?.todayRevenue ?? 0, orders: orderStats?.todayOrders ?? 0 },
    { name: 'This Month', revenue: orderStats?.monthlyRevenue ?? 0, orders: orderStats?.monthlyOrders ?? 0 },
  ];

  const productData = productStats ? [
    { name: 'Active', value: productStats.activeProducts },
    { name: 'Out of Stock', value: productStats.outOfStock },
    { name: 'Low Stock', value: productStats.lowStockCount },
  ] : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Analytics" description="Sales performance and inventory insights" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: formatPrice(orderStats?.todayRevenue ?? 0) },
          { label: 'Monthly Revenue', value: formatPrice(orderStats?.monthlyRevenue ?? 0) },
          { label: 'Avg. Order Value', value: formatPrice(orderStats?.averageOrderValue ?? 0) },
          { label: 'Total Products', value: productStats?.totalProducts ?? 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-6">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Bar dataKey="revenue" fill="#b5451b" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-6">Orders by Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">No order data available.</p>
          )}
        </div>

        {/* Product Inventory */}
        {productData.some((d) => d.value > 0) && (
          <div className="bg-white rounded-2xl border border-border p-6 lg:col-span-2">
            <h2 className="font-semibold text-foreground mb-6">Inventory Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#c8813a" radius={[0, 6, 6, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
