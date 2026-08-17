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
    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="btn-outline btn-sm justify-center disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="btn-outline btn-sm justify-center disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
