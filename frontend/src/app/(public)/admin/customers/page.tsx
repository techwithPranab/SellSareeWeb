'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Loader2, Pencil, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import type { User, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';

type ImportantDateDraft = { label: string; date: string; notes: string };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    importantDates: [] as ImportantDateDraft[],
  });

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCustomers({ page, limit: 15, search: search || undefined, role: 'customer' });
      setCustomers(res.data ?? []);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminService.toggleCustomerStatus(userId);
      toast.success('Customer status updated');
      loadCustomers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openEdit = (customer: User) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      importantDates: (customer.importantDates ?? []).map((item) => ({
        label: item.label,
        date: item.date ? item.date.slice(0, 10) : '',
        notes: item.notes ?? '',
      })),
    });
  };

  const updateImportantDate = (index: number, field: keyof ImportantDateDraft, value: string) => {
    setForm((current) => ({
      ...current,
      importantDates: current.importantDates.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (form.importantDates.some((item) => !item.label.trim() || !item.date)) {
      toast.error('Each important date needs a label and date');
      return;
    }

    setSaving(true);
    try {
      const { user } = await adminService.updateCustomer(editing._id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        importantDates: form.importantDates.map((item) => ({
          label: item.label.trim(),
          date: item.date,
          notes: item.notes.trim() || undefined,
        })),
      });
      setCustomers((current) => current.map((customer) => customer._id === user._id ? user : customer));
      setEditing(null);
      toast.success('Customer details updated');
    } catch {
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Customers" description="Manage registered customer accounts" />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading customers…" /></div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Important Dates</th>
                  <th className="px-4 py-3 font-semibold">Loyalty Pts</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{customer.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(customer.importantDates ?? []).length ? (
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{customer.importantDates.length}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">{customer.loyaltyPoints}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(customer)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Edit customer"
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(customer._id)}
                        className={`p-1.5 rounded-lg transition-colors ${customer.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
                        title={customer.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 pb-4">
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <AdminModal open={Boolean(editing)} onClose={() => !saving && setEditing(null)} title="Edit Customer" size="lg">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field mt-1.5" />
            </label>
            <label className="text-sm font-medium">Email
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field mt-1.5" />
            </label>
            <label className="text-sm font-medium">Phone
              <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field mt-1.5" placeholder="10-digit mobile number" />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Important Dates</h3>
                <p className="text-xs text-muted-foreground">Add birthdays, anniversaries, or other customer occasions.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, importantDates: [...current.importantDates, { label: 'Birthday', date: '', notes: '' }] }))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4" /> Add date
              </button>
            </div>

            <datalist id="important-date-labels">
              <option value="Birthday" />
              <option value="Anniversary" />
              <option value="Engagement" />
              <option value="Other" />
            </datalist>

            <div className="space-y-3">
              {form.importantDates.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No important dates added yet.</div>
              )}
              {form.importantDates.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-medium text-muted-foreground">Occasion
                    <input required list="important-date-labels" value={item.label} onChange={(e) => updateImportantDate(index, 'label', e.target.value)} className="input-field mt-1" />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">Date
                    <input required type="date" value={item.date} onChange={(e) => updateImportantDate(index, 'date', e.target.value)} className="input-field mt-1" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, importantDates: current.importantDates.filter((_, itemIndex) => itemIndex !== index) }))}
                    className="self-end rounded-lg p-2.5 text-red-500 hover:bg-red-50"
                    aria-label="Remove important date"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Notes (optional)
                    <input value={item.notes} onChange={(e) => updateImportantDate(index, 'notes', e.target.value)} className="input-field mt-1" placeholder="Gift preference or reminder note" maxLength={250} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
