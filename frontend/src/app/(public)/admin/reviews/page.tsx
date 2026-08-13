'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, MessageSquare, Star } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import type { Review, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [page, setPage] = useState(1);
  const [replyModal, setReplyModal] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; isApproved?: boolean } = { page, limit: 15 };
      if (filter === 'pending') params.isApproved = false;
      if (filter === 'approved') params.isApproved = true;
      const res = await adminService.getReviews(params);
      setReviews(res.data ?? []);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveReview(id);
      toast.success('Review approved');
      loadReviews();
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and delete this review?')) return;
    try {
      await adminService.rejectReview(id);
      toast.success('Review rejected');
      loadReviews();
    } catch {
      toast.error('Failed to reject review');
    }
  };

  const handleReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    setReplying(true);
    try {
      await adminService.replyToReview(replyModal._id, replyText.trim());
      toast.success('Reply posted');
      setReplyModal(null);
      setReplyText('');
      loadReviews();
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Review Moderation" description="Approve, reject, and reply to customer reviews" />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize transition-colors ${
                filter === f ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading reviews…" /></div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No reviews found.</div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <div key={review._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs text-muted-foreground">Verified Purchase</span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground">{review.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {review.user?.name || 'Deleted customer'} · {formatDate(review.createdAt)}
                    </p>
                    {review.adminReply && (
                      <div className="mt-3 p-3 bg-surface rounded-lg text-sm">
                        <p className="text-xs font-semibold text-primary mb-1">Admin Reply</p>
                        <p className="text-muted-foreground">{review.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!review.isApproved && (
                      <button onClick={() => handleApprove(review._id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Approve">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setReplyModal(review); setReplyText(review.adminReply ?? ''); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Reply">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(review._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Reject">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 pb-4">
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <AdminModal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Review">
        <div className="space-y-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Write your reply…"
            className="input-field resize-none"
          />
          <div className="flex gap-3">
            <button onClick={handleReply} disabled={replying} className="btn-primary btn-sm">
              {replying ? 'Posting…' : 'Post Reply'}
            </button>
            <button onClick={() => setReplyModal(null)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
