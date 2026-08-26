'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, FolderOpen, Loader2, X } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import type { Category } from '@/types';
import toast from 'react-hot-toast';

interface CategoryFormState {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  showInHeader: boolean;
}

const EMPTY_FORM: CategoryFormState = { name: '', description: '', sortOrder: '0', isActive: true, showInHeader: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { categories } = await adminService.getCategories();
      setCategories(categories);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
      showInHeader: cat.showInHeader !== false,
    });
    setImageFile(null);
    setImagePreview(cat.image ?? '');
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('sortOrder', form.sortOrder);
      fd.append('isActive', String(form.isActive));
      fd.append('showInHeader', String(form.showInHeader));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await adminService.updateCategory(editing._id, fd);
        toast.success('Category updated successfully');
      } else {
        await adminService.createCategory(fd);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch {
      toast.error(editing ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (cat: Category) => {
    setStatusUpdatingId(cat._id);
    try {
      const { category } = await adminService.updateCategoryStatus(cat._id, !cat.isActive);
      setCategories((current) => current.map((item) => item._id === cat._id ? category : item));
      toast.success(`${cat.name} is now ${category.isActive ? 'active' : 'inactive'}`);
    } catch {
      toast.error('Failed to update category status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setDeletingId(cat._id);
    try {
      await adminService.deleteCategory(cat._id);
      toast.success('Category deleted');
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Manage product categories"
        action={
          <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">No categories yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Create your first category to organise products.</p>
          <button onClick={openCreate} className="btn-primary btn-sm">
            Add Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Category</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium hidden md:table-cell">Description</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-medium">Products</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-medium hidden sm:table-cell">Sort</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface shrink-0">
                            <Image src={cat.image} alt={cat.name} fill sizes="40px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
                            <FolderOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell max-w-[240px]">
                      <p className="line-clamp-2">{cat.description || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-medium text-foreground">{cat.productCount ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 text-center text-muted-foreground hidden sm:table-cell">
                      {cat.sortOrder}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(cat)}
                        disabled={statusUpdatingId === cat._id}
                        className={`inline-flex min-w-[78px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          cat.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={`Mark ${cat.name} as ${cat.isActive ? 'inactive' : 'active'}`}
                      >
                        {statusUpdatingId === cat._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : cat.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === cat._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="max-h-[95dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-lg font-bold text-foreground">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Silk Sarees"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="label">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.value === 'active' }))}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inactive categories remain available in Admin but are hidden from public pages.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={form.showInHeader}
                  onChange={(e) => setForm((current) => ({ ...current, showInHeader: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">Show in header menu</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Display this category in the desktop and mobile customer navigation.
                  </span>
                </span>
              </label>

              <div>
                <label className="label">Image</label>
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden mb-2 bg-surface">
                    <Image src={imagePreview} alt="preview" fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm text-muted-foreground file:btn-outline file:btn-sm file:mr-3 file:cursor-pointer"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary btn-sm flex items-center gap-2 min-w-[100px] justify-center"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
