'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { AlertCircle, Package, RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDateTime, formatPrice } from '@/utils/helpers';
import { ORDER_STATUS_CONFIG } from '@/constants';
import type { DashboardStats } from '@/types';
import type { ProductStats } from '@/services/admin.service';

const COLORS = ['#b5451b', '#c8813a', '#3d6b4f', '#6b2fa0', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];

export default function AdminAnalyticsPage() {
  const [orderStats, setOrderStats] = useState<DashboardStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    try {
      const [orders, products] = await Promise.all([
        adminService.getOrderStats(),
        adminService.getProductStats(),
      ]);
      setOrderStats(orders);
      setProductStats(products);
      setError('');
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Analytics data could not be loaded. Check the backend connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    const interval = window.setInterval(() => loadAnalytics(true), 30_000);
    return () => window.clearInterval(interval);
  }, [loadAnalytics]);

  const statusData = useMemo(() => (orderStats?.statusDistribution ?? []).map((item) => ({
    name: ORDER_STATUS_CONFIG[item._id]?.label ?? item._id.replace(/_/g, ' '),
    value: item.count,
  })), [orderStats]);

  const revenueData = useMemo(() => (orderStats?.dailyRevenue ?? []).map((item) => ({
    date: new Date(`${item._id}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: item.revenue,
    orders: item.orders,
  })), [orderStats]);

  const productData = productStats ? [
    { name: 'Active', value: productStats.activeProducts },
    { name: 'Out of Stock', value: productStats.outOfStock },
    { name: 'Low Stock', value: productStats.lowStockCount },
  ] : [];

  if (loading) return <LoadingSpinner label="Loading live analytics…" />;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description={orderStats?.lastUpdated ? `Live data · Updated ${formatDateTime(orderStats.lastUpdated)}` : 'Live sales and inventory insights'}
        action={(
          <button onClick={() => loadAnalytics(true)} disabled={refreshing} className="btn-outline btn-sm inline-flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-semibold">Unable to refresh analytics</p><p>{error}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Today’s Revenue" value={formatPrice(orderStats?.todayRevenue ?? 0)} icon={TrendingUp} />
        <Kpi label="Today’s Orders" value={orderStats?.todayOrders ?? 0} icon={Package} />
        <Kpi label="Monthly Revenue" value={formatPrice(orderStats?.monthlyRevenue ?? 0)} icon={TrendingUp} />
        <Kpi label="Monthly Orders" value={orderStats?.monthlyOrders ?? 0} icon={Package} />
        <Kpi label="Customers" value={orderStats?.totalCustomers ?? 0} icon={Users} />
        <Kpi label="Active Products" value={productStats?.activeProducts ?? 0} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Revenue — Last 30 Days" className="xl:col-span-2">
          {revenueData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                <Tooltip formatter={(value: number, name: string) => name === 'Revenue' ? formatPrice(value) : value} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#b5451b" strokeWidth={3} dot={{ r: 3 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty text="No completed or delivered sales in the last 30 days." />}
        </ChartCard>

        <ChartCard title="Orders by Status">
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={82} labelLine={false} label={({ value }) => value}>
                  {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty text="No orders available." />}
        </ChartCard>

        <ChartCard title="Top Products — Last 30 Days" className="xl:col-span-2">
          {(orderStats?.topProducts ?? []).length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="pb-3 font-medium">Product</th><th className="pb-3 text-right font-medium">Units</th><th className="pb-3 text-right font-medium">Sales</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {orderStats!.topProducts.map((product) => <tr key={product._id}><td className="py-3 font-medium">{product.name}</td><td className="py-3 text-right">{product.quantity}</td><td className="py-3 text-right font-semibold">{formatPrice(product.revenue)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No product sales available." />}
        </ChartCard>

        <ChartCard title="Payment Methods">
          {(orderStats?.paymentDistribution ?? []).length ? (
            <div className="space-y-3">
              {orderStats!.paymentDistribution.map((payment, index) => (
                <div key={payment._id} className="flex items-center justify-between rounded-xl bg-surface p-3">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-sm font-medium uppercase">{payment._id}</span></div>
                  <div className="text-right"><p className="text-sm font-semibold">{payment.count} orders</p><p className="text-xs text-muted-foreground">{formatPrice(payment.amount)}</p></div>
                </div>
              ))}
            </div>
          ) : <Empty text="No payment data available." />}
        </ChartCard>

        <ChartCard title="Inventory Breakdown" className="xl:col-span-3">
          {productData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={productData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#c8813a" radius={[0, 6, 6, 0]} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty text="No inventory data available." />}
        </ChartCard>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="rounded-2xl border border-border bg-white p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold text-foreground">{value}</p></div>;
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-white p-6 ${className}`}><h2 className="mb-6 font-semibold text-foreground">{title}</h2>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-16 text-center text-sm text-muted-foreground">{text}</p>;
}
