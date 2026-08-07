'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Banner } from '@/types';
import toast from 'react-hot-toast';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState<Banner['position']>('hero');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await adminService.getBanners();
      setBanners(res.banners);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBanners(); }, []);

  const resetForm = () => {
    setTitle(''); setSubtitle(''); setLink(''); setPosition('hero');
    setSortOrder(0); setIsActive(true); setImageFile(null);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle ?? '');
    setLink(banner.link ?? '');
    setPosition(banner.position);
    setSortOrder(banner.sortOrder);
    setIsActive(banner.isActive);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!editing && !imageFile) { toast.error('Image is required'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (subtitle) formData.append('subtitle', subtitle);
      if (link) formData.append('link', link);
      formData.append('position', position);
      formData.append('sortOrder', String(sortOrder));
      formData.append('isActive', String(isActive));
      if (imageFile) formData.append('image', imageFile);

      if (editing) {
        await adminService.updateBanner(editing._id, formData);
        toast.success('Banner updated');
      } else {
        await adminService.createBanner(formData);
        toast.success('Banner created');
      }
      setModalOpen(false);
      loadBanners();
    } catch {
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await adminService.deleteBanner(id);
      toast.success('Banner deleted');
      loadBanners();
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        description="Manage homepage and promotional banners"
        action={
          <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner label="Loading banners…" />
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center text-muted-foreground text-sm">
          No banners yet. Add your first promotional banner.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="relative aspect-[21/9] bg-surface">
                <Image src={banner.image} alt={banner.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{banner.title}</p>
                    {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{banner.position} · Order: {banner.sortOrder}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(banner)} className="btn-outline btn-sm flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(banner._id)} className="btn-outline btn-sm text-red-600 border-red-200 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Link URL</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/products?sale=true" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <select value={position} onChange={(e) => setPosition(e.target.value as Banner['position'])} className="input-field">
                <option value="hero">Hero</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
                <option value="popup">Popup</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">{editing ? 'Replace Image (optional)' : 'Banner Image *'}</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="input-field py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-primary" />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
