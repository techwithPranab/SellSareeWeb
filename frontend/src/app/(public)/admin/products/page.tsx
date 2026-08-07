'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPagination from '@/components/admin/AdminPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice, getProductDefaultImage, asRoute } from '@/utils/helpers';
import type { Product, PaginationMeta } from '@/types';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({ page, limit: 15, search: search || undefined });
      setProducts(res.data ?? []);
      setPagination(res.meta?.pagination ?? null);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteProduct(id);
      toast.success('Product deleted');
      loadProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage your saree catalogue"
        action={
          <Link href={asRoute('/admin/products/new')} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading products…" /></div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Product</th>
                  <th className="px-4 py-3 font-semibold text-foreground">SKU</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Price</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Stock</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-surface shrink-0">
                          <Image src={getProductDefaultImage(product)} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{product.fabric}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(product.salePrice || product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock <= 5 ? 'text-red-600 font-medium' : ''}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/products/${product.slug}`} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={asRoute(`/admin/products/${product._id}/edit`)} className="p-1.5 rounded-lg hover:bg-muted/50 text-primary" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(product._id, product.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
