import { PAGINATION } from '../constants';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface PaginationResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export const parsePagination = (
  options: PaginationOptions
): { skip: number; limit: number; page: number; sort: Record<string, 1 | -1> } => {
  const page = Math.max(1, Number(options.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, Number(options.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const sortField = options.sortBy || 'createdAt';
  const sortDirection: 1 | -1 = options.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

  return { skip, limit, page, sort };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};
