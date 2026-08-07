'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchProducts } from '@/features/products/productsSlice';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/common/LoadingSpinner';
import { SAREE_CATEGORIES, SORT_OPTIONS, PRICE_RANGES, FABRICS, OCCASIONS } from '@/constants';
import { cn } from '@/utils/helpers';
import { useDebounce } from '@/hooks/useDebounce';
export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, isLoading, pagination } = useAppSelector((s) => s.products);
  const totalItems = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync URL params → dispatch on mount
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });

    dispatch(fetchProducts({
      filter: {
        search: params.search,
        category: params.category,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        isFeatured: params.featured === 'true',
        fabric: params.fabric,
        occasion: params.occasion,
      },
      page: params.page ? Number(params.page) : 1,
      sortBy: params.sort?.split('_')[0] ?? 'createdAt',
      sortOrder: params.sort?.split('_')[1] ?? 'desc',
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (debouncedSearch) {
      current.set('search', debouncedSearch);
    } else {
      current.delete('search');
    }
    current.set('page', '1');
    router.push(`/products?${current.toString()}`, { scroll: false });
  }, [debouncedSearch, router]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const current = new URLSearchParams(window.location.search);
      if (value) current.set(key, value);
      else current.delete(key);
      current.set('page', '1');
      router.push(`/products?${current.toString()}`, { scroll: false });
    },
    [router]
  );

  const activeCategory = searchParams.get('category');
  const activeSort = searchParams.get('sort') ?? SORT_OPTIONS[0].value;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-playfair">
            {activeCategory
              ? SAREE_CATEGORIES.find((c) => c.slug === activeCategory)?.name ?? 'Sarees'
              : 'All Sarees'}
          </h1>
          {!isLoading && (
            <p className="text-muted text-sm mt-1">{totalItems} products found</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search sarees…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-9 pr-3 py-2 text-sm w-52"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={activeSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn('btn-outline btn-sm flex items-center gap-1.5 lg:hidden', showFilters && 'bg-primary text-white border-primary')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* View Mode */}
          <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted/50')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted/50')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* ── Sidebar Filters ────────────────────────────────────────────── */}
        <aside
          className={cn(
            'w-64 shrink-0 space-y-6',
            'hidden lg:block',
            showFilters && 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0'
          )}
        >
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-semibold text-foreground">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categories */}
          <FilterSection title="Category">
            <div className="space-y-2">
              <button
                onClick={() => updateParam('category', null)}
                className={cn(
                  'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                  !activeCategory ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
                )}
              >
                All Categories
              </button>
              {SAREE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => updateParam('category', cat.slug)}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                    activeCategory === cat.slug
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/50 text-foreground'
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range">
            <div className="space-y-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    updateParam('minPrice', String(range.min));
                    updateParam('maxPrice', String(range.max === Infinity ? 999999 : range.max));
                  }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Fabric */}
          <FilterSection title="Fabric">
            <div className="flex flex-wrap gap-2">
              {FABRICS.map((fabric) => (
                <button
                  key={fabric}
                  onClick={() => updateParam('fabric', fabric)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors',
                    searchParams.get('fabric') === fabric
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary text-foreground'
                  )}
                >
                  {fabric}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Occasion */}
          <FilterSection title="Occasion">
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  onClick={() => updateParam('occasion', occ.toLowerCase())}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors',
                    searchParams.get('occasion') === occ.toLowerCase()
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary text-foreground'
                  )}
                >
                  {occ}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Clear Filters */}
          <button
            onClick={() => router.push('/products')}
            className="w-full btn-outline btn-sm"
          >
            Clear All Filters
          </button>
        </aside>

        {/* ── Product Grid ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="text-6xl">🪁</span>
              <h3 className="text-lg font-semibold text-foreground">No products found</h3>
              <p className="text-muted max-w-sm">
                Try adjusting your filters or search for something different.
              </p>
              <button onClick={() => router.push('/products')} className="btn-primary btn-sm">
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                  : 'flex flex-col gap-4'
              )}
            >
              {items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam('page', String(i + 1))}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    currentPage === i + 1
                      ? 'bg-primary text-white'
                      : 'border border-border hover:border-primary text-foreground'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 font-semibold text-sm text-foreground"
      >
        {title}
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}
