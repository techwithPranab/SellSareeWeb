'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Building2, CalendarDays, Download, IndianRupee, Pencil, Plus, ReceiptIndianRupee, Trash2, WalletCards } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminModal from '@/components/admin/AdminModal';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService, type AdminExpense, type ExpenseSummary } from '@/services/admin.service';
import { formatDate, formatPrice } from '@/utils/helpers';
import type { PaginationMeta } from '@/types';

const CATEGORIES = [
  'Inventory', 'Packaging', 'Shipping', 'Marketing', 'Website & Technology',
  'Office', 'Utilities', 'Professional Fees', 'Travel', 'Other',
];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'] as const;
const INVESTMENT_CATEGORIES = ['Bank Deposit', 'Owner Investment', 'Other Investment'];

type ExpenseDraft = Omit<AdminExpense, '_id' | 'createdAt' | 'updatedAt'>;

const indiaDate = (value: Date | string = new Date()): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));

const EMPTY_EXPENSE: ExpenseDraft = {
  transactionType: 'expense',
  expenseDate: indiaDate(),
  category: 'Inventory',
  amount: 0,
  description: '',
  vendor: '',
  paymentMethod: 'UPI',
  reference: '',
  notes: '',
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminExpense | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseResponse, summaryResponse] = await Promise.all([
        adminService.getExpenses({ page, limit: 20, category: category || undefined, from: from || undefined, to: to || undefined }),
        adminService.getExpenseSummary(),
      ]);
      setExpenses(expenseResponse.data ?? []);
      setPagination(expenseResponse.meta?.pagination ?? null);
      setSummary(summaryResponse.summary);
    } catch {
      toast.error('Could not load the expense ledger');
    } finally {
      setLoading(false);
    }
  }, [category, from, page, to]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = (transactionType: 'expense' | 'investment' = 'expense') => {
    setEditing(null);
    setDraft({
      ...EMPTY_EXPENSE,
      transactionType,
      expenseDate: indiaDate(),
      category: transactionType === 'investment' ? 'Bank Deposit' : 'Inventory',
      paymentMethod: transactionType === 'investment' ? 'Bank Transfer' : 'UPI',
    });
    setModalOpen(true);
  };

  const openEdit = (expense: AdminExpense) => {
    setEditing(expense);
    setDraft({
      transactionType: expense.transactionType || 'expense',
      expenseDate: indiaDate(expense.expenseDate),
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || '',
      notes: expense.notes || '',
    });
    setModalOpen(true);
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.description.trim() || draft.amount <= 0) {
      toast.error('Enter a description and an amount greater than zero');
      return;
    }
    setSaving(true);
    try {
      if (editing) await adminService.updateExpense(editing._id, draft);
      else await adminService.createExpense(draft);
      toast.success(editing ? 'Expense updated' : 'Expense recorded');
      setModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Could not save the expense');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (expense: AdminExpense) => {
    if (!window.confirm(`Delete “${expense.description}” for ${formatPrice(expense.amount)}?`)) return;
    try {
      await adminService.deleteExpense(expense._id);
      toast.success('Expense deleted');
      await loadData();
    } catch {
      toast.error('Could not delete the expense');
    }
  };

  const exportLedger = async () => {
    setExporting(true);
    try {
      const blob = await adminService.exportExpenses({ category: category || undefined, from: from || undefined, to: to || undefined });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pps-aura-ledger-${indiaDate()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Ledger exported');
    } catch {
      toast.error('Could not export the ledger');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Expense Tracker"
        description="Track administrative expenditure and today’s net cash position"
        action={<div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={exportLedger} disabled={exporting} className="btn-outline btn-sm gap-2"><Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}</button><button type="button" onClick={() => openCreate('investment')} className="btn-outline btn-sm gap-2"><Building2 className="h-4 w-4" /> Add Bank Deposit</button><button type="button" onClick={() => openCreate('expense')} className="btn-primary btn-sm gap-2"><Plus className="h-4 w-4" /> Add Expense</button></div>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryCard label="Current Balance" value={summary?.currentBalance ?? 0} icon={WalletCards} highlight />
        <SummaryCard label="Completed Revenue" value={summary?.totalRevenue ?? 0} icon={IndianRupee} />
        <SummaryCard label="Business Investment" value={summary?.totalInvestments ?? 0} icon={Building2} positive />
        <SummaryCard label="Total Expenses" value={summary?.totalExpenses ?? 0} icon={ReceiptIndianRupee} />
        <SummaryCard label="This Month" value={summary?.monthExpenses ?? 0} icon={CalendarDays} />
        <SummaryCard label="Today" value={summary?.todayExpenses ?? 0} icon={CalendarDays} />
      </div>

      {!!summary?.byCategory.length && (
        <section className="mb-6 rounded-2xl border border-border bg-white p-4 sm:p-5">
          <h2 className="mb-4 font-semibold text-foreground">Expenditure by Category</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.byCategory.map((item) => {
              const percentage = summary.totalExpenses > 0 ? (item.amount / summary.totalExpenses) * 100 : 0;
              return (
                <div key={item._id} className="rounded-xl bg-surface p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item._id}</span>
                    <span className="font-semibold">{formatPrice(item.amount)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, percentage)}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{item.count} {item.count === 1 ? 'entry' : 'entries'} · {percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-6 rounded-2xl border border-border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Category</label><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="input-field"><option value="">All categories</option>{[...CATEGORIES, ...INVESTMENT_CATEGORIES].map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="label">From date</label><input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="input-field" /></div>
          <div><label className="label">To date</label><input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="input-field" /></div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {loading ? <div className="p-10"><LoadingSpinner label="Loading expenses…" /></div> : expenses.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground"><ReceiptIndianRupee className="mx-auto mb-3 h-8 w-8" />No expenses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">{expenses.map((expense) => <tr key={expense._id} className="hover:bg-surface/40"><td className="px-5 py-4 whitespace-nowrap">{formatDate(expense.expenseDate)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${expense.transactionType === 'investment' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>{expense.category}</span></td><td className="max-w-[260px] px-5 py-4"><p className="font-medium text-foreground">{expense.description}</p>{expense.reference && <p className="truncate text-xs text-muted-foreground">Ref: {expense.reference}</p>}</td><td className="px-5 py-4 text-muted-foreground">{expense.vendor || '—'}</td><td className="px-5 py-4">{expense.paymentMethod}</td><td className={`px-5 py-4 text-right font-semibold ${expense.transactionType === 'investment' ? 'text-green-600' : 'text-red-600'}`}>{expense.transactionType === 'investment' ? '+' : '−'}{formatPrice(expense.amount)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(expense)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" aria-label="Edit transaction"><Pencil className="h-4 w-4" /></button><button onClick={() => removeExpense(expense)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete transaction"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4"><AdminPagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      <AdminModal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editing ? `Edit ${draft.transactionType === 'investment' ? 'Investment' : 'Expense'}` : draft.transactionType === 'investment' ? 'Add Bank Deposit' : 'Add Expense'} size="lg">
        <form onSubmit={submitExpense} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expense date"><input required type="date" value={draft.expenseDate} onChange={(e) => setDraft({ ...draft, expenseDate: e.target.value })} className="input-field" /></Field>
            <Field label="Category"><select required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input-field">{(draft.transactionType === 'investment' ? INVESTMENT_CATEGORIES : CATEGORIES).map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Amount (₹)"><input required type="number" min="0.01" step="0.01" value={draft.amount || ''} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className="input-field" /></Field>
            <Field label="Payment method"><select value={draft.paymentMethod} onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value as ExpenseDraft['paymentMethod'] })} className="input-field">{PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="Description"><input required maxLength={250} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input-field" placeholder="What was this expense for?" /></Field></div>
            <Field label="Vendor / Payee"><input maxLength={120} value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} className="input-field" /></Field>
            <Field label="Transaction reference"><input maxLength={150} value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} className="input-field" /></Field>
            <div className="sm:col-span-2"><Field label="Notes"><textarea rows={3} maxLength={1000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input-field resize-none" /></Field></div>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-outline btn-sm">Cancel</button><button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? 'Saving…' : editing ? 'Update Transaction' : draft.transactionType === 'investment' ? 'Record Deposit' : 'Record Expense'}</button></div>
        </form>
      </AdminModal>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, highlight = false, positive = false }: { label: string; value: number; icon: React.ElementType; highlight?: boolean; positive?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${highlight ? 'border-primary/30 bg-primary text-white' : 'border-border bg-white'}`}><div className="flex items-center justify-between"><p className={`text-xs font-medium ${highlight ? 'text-white/75' : 'text-muted-foreground'}`}>{label}</p><Icon className="h-4 w-4" /></div><p className={`mt-2 text-xl font-bold ${!highlight && value < 0 ? 'text-red-600' : positive ? 'text-green-600' : ''}`}>{formatPrice(value)}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
