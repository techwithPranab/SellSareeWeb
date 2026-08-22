'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService, type StoreSettings } from '@/services/admin.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const EMPTY_SETTINGS: StoreSettings = {
  storeName: 'PP’s Aura',
  supportEmail: 'support@ppaura.in',
  supportPhone: '',
  storeAddress: '',
  freeShippingThreshold: 999,
  standardShippingRate: 99,
  loyaltyPointsRate: 1,
  socialLinks: {},
};

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'twitter', 'youtube', 'pinterest', 'whatsapp'];

export default function AdminSettingsPage() {
  const { user, fetchCurrentUser } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [draft, setDraft] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSettings, setEditSettings] = useState(false);
  const [editAccount, setEditAccount] = useState(false);
  const [account, setAccount] = useState({ name: '', phone: '' });

  useEffect(() => {
    adminService.getStoreSettings()
      .then(({ settings: loaded }) => {
        setSettings(loaded);
        setDraft(loaded);
      })
      .catch(() => toast.error('Failed to load store settings'))
      .finally(() => setLoading(false));
  }, []);

  const openSettingsEditor = () => {
    setDraft({ ...settings, socialLinks: { ...settings.socialLinks } });
    setEditSettings(true);
  };

  const openAccountEditor = () => {
    setAccount({ name: user?.name ?? '', phone: user?.phone ?? '' });
    setEditAccount(true);
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { settings: updated } = await adminService.updateStoreSettings(draft);
      setSettings(updated);
      setDraft(updated);
      setEditSettings(false);
      toast.success('Store settings updated');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile({ name: account.name.trim(), phone: account.phone.trim() || undefined });
      await fetchCurrentUser();
      setEditAccount(false);
      toast.success('Admin account updated');
    } catch {
      toast.error('Failed to update admin account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading settings…" />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Store configuration and account information"
        action={(
          <button onClick={openSettingsEditor} className="btn-primary btn-sm inline-flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edit Settings
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Store Information</h2>
          <dl className="space-y-3 text-sm">
            <SettingRow label="Store Name" value={settings.storeName} />
            <SettingRow label="Support Email" value={settings.supportEmail} />
            <SettingRow label="Support Phone" value={settings.supportPhone || '—'} />
            <SettingRow label="Store Address" value={settings.storeAddress || '—'} />
            <SettingRow label="Free Shipping Threshold" value={`₹${settings.freeShippingThreshold}`} />
            <SettingRow label="Standard Shipping" value={`₹${settings.standardShippingRate}`} />
            <SettingRow label="Loyalty Points Rate" value={`${settings.loyaltyPointsRate} pt / ₹1`} />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Admin Account</h2>
            <button onClick={openAccountEditor} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
          <dl className="space-y-3 text-sm">
            <SettingRow label="Name" value={user?.name || '—'} />
            <SettingRow label="Email" value={user?.email || '—'} />
            <SettingRow label="Phone" value={user?.phone || '—'} />
            <SettingRow label="Role" value={user?.role?.replace(/_/g, ' ') || '—'} capitalize />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 md:col-span-2">
          <h2 className="font-semibold text-foreground mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {SOCIAL_PLATFORMS.map((platform) => {
              const url = settings.socialLinks?.[platform];
              const href = platform === 'whatsapp' && url && !/^https?:\/\//i.test(url)
                ? `https://wa.me/${url.replace(/\D/g, '')}`
                : url;
              return (
                <div key={platform} className="flex items-center justify-between gap-3 p-3 bg-surface rounded-lg">
                  <span className="capitalize font-medium text-foreground">{platform}</span>
                  {url ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline truncate max-w-[260px]">{url}</a> : <span className="text-xs text-muted-foreground">Not set</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AdminModal open={editSettings} onClose={() => !saving && setEditSettings(false)} title="Edit Store Settings" size="lg">
        <form onSubmit={saveSettings} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store Name"><input required className="input-field mt-1.5" value={draft.storeName} onChange={(e) => setDraft({ ...draft, storeName: e.target.value })} /></Field>
            <Field label="Support Email"><input required type="email" className="input-field mt-1.5" value={draft.supportEmail} onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })} /></Field>
            <Field label="Support Phone"><input type="tel" className="input-field mt-1.5" placeholder="+91 98765 43210" value={draft.supportPhone} onChange={(e) => setDraft({ ...draft, supportPhone: e.target.value })} /></Field>
            <Field label="Store Address" wide><textarea className="input-field mt-1.5 min-h-20" value={draft.storeAddress} onChange={(e) => setDraft({ ...draft, storeAddress: e.target.value })} /></Field>
            <NumberField label="Free Shipping Threshold (₹)" value={draft.freeShippingThreshold} onChange={(value) => setDraft({ ...draft, freeShippingThreshold: value })} />
            <NumberField label="Standard Shipping Rate (₹)" value={draft.standardShippingRate} onChange={(value) => setDraft({ ...draft, standardShippingRate: value })} />
            <NumberField label="Loyalty Points per ₹1" value={draft.loyaltyPointsRate} onChange={(value) => setDraft({ ...draft, loyaltyPointsRate: value })} />
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Social Media Links</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_PLATFORMS.map((platform) => (
                <Field key={platform} label={platform === 'whatsapp' ? 'WhatsApp Number' : platform} capitalize>
                  <input type={platform === 'whatsapp' ? 'tel' : 'url'} className="input-field mt-1.5" placeholder={platform === 'whatsapp' ? '919876543210' : `https://${platform}.com/...`} value={draft.socialLinks?.[platform] ?? ''} onChange={(e) => setDraft({ ...draft, socialLinks: { ...draft.socialLinks, [platform]: e.target.value } })} />
                </Field>
              ))}
            </div>
          </div>
          <ModalActions saving={saving} onCancel={() => setEditSettings(false)} />
        </form>
      </AdminModal>

      <AdminModal open={editAccount} onClose={() => !saving && setEditAccount(false)} title="Edit Admin Account">
        <form onSubmit={saveAccount} className="space-y-4">
          <Field label="Name"><input required minLength={2} className="input-field mt-1.5" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} /></Field>
          <Field label="Phone"><input inputMode="numeric" className="input-field mt-1.5" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} placeholder="10-digit mobile number" /></Field>
          <p className="text-xs text-muted-foreground">The login email and role cannot be changed here.</p>
          <ModalActions saving={saving} onCancel={() => setEditAccount(false)} />
        </form>
      </AdminModal>
    </div>
  );
}

function SettingRow({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className={`font-medium text-right ${capitalize ? 'capitalize' : ''}`}>{value}</dd></div>;
}

function Field({ label, children, wide = false, capitalize = false }: { label: string; children: React.ReactNode; wide?: boolean; capitalize?: boolean }) {
  return <label className={`text-sm font-medium ${wide ? 'sm:col-span-2' : ''} ${capitalize ? 'capitalize' : ''}`}>{label}{children}</label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input required type="number" min="0" step="0.01" className="input-field mt-1.5" value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>;
}

function ModalActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-3 border-t border-border pt-4"><button type="button" disabled={saving} onClick={onCancel} className="btn-outline btn-sm">Cancel</button><button type="submit" disabled={saving} className="btn-primary btn-sm inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save Changes</button></div>;
}
