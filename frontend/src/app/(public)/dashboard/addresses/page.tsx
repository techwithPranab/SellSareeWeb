'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { addressFormSchema, type AddressFormData } from '@/validations/checkout.schema';
import { INDIAN_STATES } from '@/constants';
import type { Address } from '@/types';
import toast from 'react-hot-toast';

export default function AddressesPage() {
  const { fetchCurrentUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: { country: 'India', type: 'home', isDefault: false },
  });

  const loadAddresses = async () => {
    try {
      const res = await userService.getAddresses();
      setAddresses(res.addresses);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const onSubmit = async (data: AddressFormData) => {
    setSaving(true);
    try {
      await userService.addAddress(data);
      await loadAddresses();
      await fetchCurrentUser();
      reset();
      setShowForm(false);
      toast.success('Address added successfully');
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await userService.deleteAddress(id);
      await loadAddresses();
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userService.setDefaultAddress(id);
      await loadAddresses();
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-foreground">My Addresses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your delivery addresses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">New Address</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name</label>
              <input {...register('fullName')} className="input-field" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input-field" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Pincode</label>
              <input {...register('pincode')} className="input-field" />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address Line 1</label>
              <input {...register('addressLine1')} className="input-field" />
              {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address Line 2</label>
              <input {...register('addressLine2')} className="input-field" />
            </div>
            <div>
              <label className="label">City</label>
              <input {...register('city')} className="input-field" />
            </div>
            <div>
              <label className="label">State</label>
              <select {...register('state')} className="input-field">
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('isDefault')} className="accent-primary" />
                Set as default address
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary btn-sm flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Address
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <MapPin className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr._id} className="bg-white rounded-2xl border border-border p-5 relative">
              {addr.isDefault && (
                <span className="absolute top-4 right-4 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
              <p className="font-semibold text-foreground">{addr.fullName}</p>
              <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}
                <br />{addr.city}, {addr.state} — {addr.pincode}
              </p>
              <div className="flex gap-2 mt-4">
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr._id)} className="btn-outline btn-sm flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3" /> Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(addr._id)} className="btn-outline btn-sm flex items-center gap-1 text-xs text-red-600 border-red-200">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
