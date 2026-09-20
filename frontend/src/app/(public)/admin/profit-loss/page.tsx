'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Calculator, RefreshCw, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService, type ProfitLossMetrics, type ProfitLossReport } from '@/services/admin.service';
import { formatPrice } from '@/utils/helpers';

const localDate = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

export default function ProfitLossPage() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(localDate(now));
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    try {
      setReport(await adminService.getProfitLoss({ from, to }));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Could not load the profit and loss report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [from, to]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const trend = useMemo(() => (report?.trend || []).map((item) => ({
    ...item,
    label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
  })), [report]);

  if (loading) return <LoadingSpinner label="Calculating profit and loss…" />;
  const current = report?.current;
  const previous = report?.previous;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Profit & Loss"
        description="Track profitability, EBITDA, margins, and business growth"
        action={<button type="button" onClick={() => loadReport(true)} disabled={refreshing} className="btn-outline btn-sm gap-2"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>}
      />

      <section className="rounded-2xl border border-border bg-white p-4">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div><label className="label">From date</label><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="input-field" /></div>
          <div><label className="label">To date</label><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="input-field" /></div>
          <button type="button" onClick={() => loadReport(true)} disabled={refreshing || !from || !to} className="btn-primary h-[50px]">Apply</button>
        </div>
      </section>

      {current && previous && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Revenue" value={current.revenue} previous={previous.revenue} icon={TrendingUp} />
          <MetricCard label="Gross Profit" value={current.grossProfit} previous={previous.grossProfit} icon={Scale} margin={current.grossMargin} />
          <MetricCard label="EBITDA" value={current.ebitda} previous={previous.ebitda} icon={Calculator} margin={current.ebitdaMargin} />
          <MetricCard label={current.netProfit >= 0 ? 'Net Profit' : 'Net Loss'} value={current.netProfit} previous={previous.netProfit} icon={current.netProfit >= 0 ? TrendingUp : TrendingDown} margin={current.netMargin} highlight />
          <div className="rounded-2xl border border-border bg-white p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Inventory Value</p><Scale className="h-4 w-4" /></div><p className="mt-2 text-2xl font-bold">{formatPrice(report!.inventory.value)}</p><div className="mt-2 space-y-1 text-xs text-muted-foreground"><p>Sarees: {report!.inventory.units} units · {formatPrice(report!.inventory.sareeValue)}</p><p>Gifts: {report!.inventory.giftUnits} units · {formatPrice(report!.inventory.giftValue)}</p></div></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <section className="rounded-2xl border border-border bg-white p-5 xl:col-span-3">
            <div className="mb-5"><h2 className="font-semibold">Profitability Trend</h2><p className="mt-1 text-xs text-muted-foreground">Monthly revenue, EBITDA, and net profit</p></div>
            {trend.length ? <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trend} margin={{ left: 4, right: 12 }}>
                <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c8813a" stopOpacity={0.3} /><stop offset="95%" stopColor="#c8813a" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c8813a" fill="url(#revenueFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="ebitda" name="EBITDA" stroke="#2563eb" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#15803d" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer> : <EmptyState />}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 xl:col-span-2">
            <h2 className="font-semibold">Income Statement</h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">For the selected period</p>
            <Statement metrics={current} expensesByCategory={report!.expensesByCategory} />
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Expense Breakdown</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">Investments and inventory purchases are excluded from operating expenses</p>
          {report!.expensesByCategory.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{report!.expensesByCategory.map((item) => {
            const total = report!.expensesByCategory.reduce((sum, row) => sum + row.amount, 0);
            const percent = total ? (item.amount / total) * 100 : 0;
            return <div key={item._id} className="rounded-xl bg-surface p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{item._id}</span><span className="font-semibold">{formatPrice(item.amount)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div><p className="mt-1.5 text-xs text-muted-foreground">{percent.toFixed(1)}% · {item.count} {item.count === 1 ? 'entry' : 'entries'}</p></div>;
          })}</div> : <EmptyState />}
        </section>

        {(report!.inventory.missingBuyPriceProducts > 0 || (current.missingBuyPriceSoldUnits || 0) > 0) && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>Buy prices missing:</strong> {report!.inventory.missingBuyPriceProducts} stocked {report!.inventory.missingBuyPriceProducts === 1 ? 'product has' : 'products have'} no buy price, and {current.missingBuyPriceSoldUnits || 0} sold {(current.missingBuyPriceSoldUnits || 0) === 1 ? 'unit has' : 'units have'} no recorded cost. Inventory value or gross profit may be understated.</p>}
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800"><strong>Calculation:</strong> Cost of goods sold is the quantity sold multiplied by each product’s buy price. Inventory purchases remain outside operating expenses. EBITDA excludes interest, taxes, depreciation, and amortization. Future orders preserve the buy price at the time of sale.</p>
      </>}
    </div>
  );
}

function MetricCard({ label, value, previous, icon: Icon, margin, highlight = false }: { label: string; value: number; previous: number; icon: React.ElementType; margin?: number; highlight?: boolean }) {
  const change = previous === 0 ? null : ((value - previous) / Math.abs(previous)) * 100;
  const positive = (change ?? 0) >= 0;
  return <div className={`rounded-2xl border p-5 ${highlight ? value >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50' : 'border-border bg-white'}`}><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon className="h-4 w-4" /></div><p className={`mt-2 text-2xl font-bold ${value < 0 ? 'text-red-600' : ''}`}>{formatPrice(value)}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{margin !== undefined && <span className="rounded-full bg-white/70 px-2 py-0.5 font-medium">{margin.toFixed(1)}% margin</span>}{change !== null && <span className={`inline-flex items-center ${positive ? 'text-green-700' : 'text-red-600'}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(change).toFixed(1)}% vs previous period</span>}</div></div>;
}

function Statement({ metrics, expensesByCategory }: { metrics: ProfitLossMetrics; expensesByCategory: ProfitLossReport['expensesByCategory'] }) {
  const nonOperatingCategories = new Set(['Inventory', 'Interest', 'Taxes', 'Depreciation & Amortization']);
  const operatingExpenses = expensesByCategory.filter((item) => !nonOperatingCategories.has(item._id));

  return <div className="text-sm"><StatementRow label="Revenue" value={metrics.revenue} strong /><StatementRow label="Cost of sold products" value={-metrics.costOfGoodsSold} /><StatementRow label="Gross profit" value={metrics.grossProfit} strong divider /><StatementRow label="Operating expenses" value={-metrics.operatingExpenses} strong />{operatingExpenses.length > 0 && <div className="mb-2 rounded-lg bg-surface px-3 py-1">{operatingExpenses.map((item) => <div key={item._id} className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-xs last:border-0"><span className="text-muted-foreground">{item._id} <span className="opacity-70">({item.count})</span></span><span className="font-medium text-red-600">−{formatPrice(item.amount)}</span></div>)}</div>}<StatementRow label="EBITDA" value={metrics.ebitda} strong divider /><StatementRow label="Depreciation & amortization" value={-metrics.depreciationAndAmortization} /><StatementRow label="EBIT" value={metrics.ebit} strong divider /><StatementRow label="Interest" value={-metrics.interest} /><StatementRow label="Profit before tax" value={metrics.profitBeforeTax} strong divider /><StatementRow label="Taxes" value={-metrics.taxes} /><StatementRow label="Net profit / loss" value={metrics.netProfit} strong final /></div>;
}

function StatementRow({ label, value, strong = false, divider = false, final = false }: { label: string; value: number; strong?: boolean; divider?: boolean; final?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 py-2.5 ${divider ? 'border-t border-border' : ''} ${final ? 'mt-1 border-t-2 border-foreground' : ''}`}><span className={strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span><span className={`${strong ? 'font-bold' : 'font-medium'} ${value < 0 ? 'text-red-600' : ''}`}>{formatPrice(value)}</span></div>;
}

function EmptyState() { return <p className="py-16 text-center text-sm text-muted-foreground">No financial activity found for this period.</p>; }
