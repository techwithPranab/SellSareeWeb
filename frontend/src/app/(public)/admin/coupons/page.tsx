'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { adminService, type AdminCoupon } from '@/services/admin.service';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface CouponForm {
  code: string;
  description: string;
  type: AdminCoupon['type'];
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  userUsageLimit: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  type: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  usageLimit: -1,
  userUsageLimit: 1,
  isActive: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CouponForm>();

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCoupons({ limit: 50 });
      setCoupons(res.data ?? []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditing(coupon);
    reset({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit,
      isActive: coupon.isActive,
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: CouponForm) => {
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateCoupon(editing._id, data);
        toast.success('Coupon updated');
      } else {
        await adminService.createCoupon(data);
        toast.success('Coupon created');
      }
      setModalOpen(false);
      loadCoupons();
    } catch {
      toast.error('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount codes"
        action={
          <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8"><LoadingSpinner label="Loading coupons…" /></div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No coupons yet. Create your first coupon.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Min Order</th>
                  <th className="px-4 py-3 font-semibold">Used</th>
                  <th className="px-4 py-3 font-semibold">Valid Until</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{coupon.code}</td>
                    <td className="px-4 py-3 capitalize">{coupon.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      {coupon.type === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-3">₹{coupon.minOrderAmount}</td>
                    <td className="px-4 py-3">
                      {coupon.usedCount}{coupon.usageLimit > 0 ? `/${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(coupon.endDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg hover:bg-muted/50 text-primary">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(coupon._id, coupon.code)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
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
      </div>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Create Coupon'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Code *</label>
              <input {...register('code', { required: true })} className="input-field uppercase" disabled={!!editing} />
            </div>
            <div>
              <label className="label">Type *</label>
              <select {...register('type')} className="input-field">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="label">Discount Value *</label>
              <input type="number" {...register('discountValue', { required: true, valueAsNumber: true })} className="input-field" />
            </div>
            <div>
              <label className="label">Min Order Amount</label>
              <input type="number" {...register('minOrderAmount', { valueAsNumber: true })} className="input-field" />
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input type="date" {...register('startDate', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" {...register('endDate', { required: true })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Description *</label>
            <input {...register('description', { required: true })} className="input-field" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-primary" />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
