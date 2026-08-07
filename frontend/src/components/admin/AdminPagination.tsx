'use client';

import React from 'react';
import { cn } from '@/utils/helpers';
import type { PaginationMeta } from '@/types';

interface AdminPaginationProps {
  pagination: PaginationMeta | null;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ pagination, onPageChange }: AdminPaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="btn-outline btn-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="btn-outline btn-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
