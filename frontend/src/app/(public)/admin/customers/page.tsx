'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserCheck, UserX } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import type { User, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
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
                    <td className="px-4 py-3 font-medium">{customer.loyaltyPoints}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(customer._id)}
                        className={`p-1.5 rounded-lg transition-colors ${customer.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
                        title={customer.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
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
    </div>
  );
}
