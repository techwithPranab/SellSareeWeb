'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService, type NewsletterSubscriber } from '@/services/admin.service';
import { formatDate } from '@/utils/helpers';
import type { PaginationMeta } from '@/types';
import toast from 'react-hot-toast';

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getNewsletterSubscribers({
        page,
        limit: 20,
        search: search || undefined,
      });
      setSubscribers(response.data ?? []);
      setPagination(response.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load newsletter subscribers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadSubscribers(); }, [loadSubscribers]);

  return (
    <div>
      <AdminPageHeader
        title="Newsletter Subscribers"
        description="View people who subscribed from the homepage"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search by email…"
              className="input-field py-2 pl-9 text-sm"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total} subscriber${pagination.total === 1 ? '' : 's'}` : ''}
          </p>
        </div>

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading subscribers…" /></div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No subscribers match your search.' : 'No newsletter subscribers yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Email address</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Subscribed on</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <a href={`mailto:${subscriber.email}`} className="font-medium text-foreground hover:text-primary">
                        {subscriber.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(subscriber.subscribedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${subscriber.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                      </span>
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
