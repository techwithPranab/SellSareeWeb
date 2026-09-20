'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminModal from '@/components/admin/AdminModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService, type GiftItem } from '@/services/admin.service';
import { formatPrice } from '@/utils/helpers';

type Draft = Omit<GiftItem, '_id' | 'createdAt' | 'updatedAt'>;
const EMPTY: Draft = { name: '', sku: '', stock: 0, unitCost: 0, isActive: true, notes: '' };

export default function GiftInventoryPage() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GiftItem | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const load = useCallback(async () => { try { setItems((await adminService.getGiftItems()).items); } catch { toast.error('Could not load gift inventory'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showForm = (item?: GiftItem) => { setEditing(item || null); setDraft(item ? { name: item.name, sku: item.sku, stock: item.stock, unitCost: item.unitCost, isActive: item.isActive, notes: item.notes || '' } : EMPTY); setOpen(true); };
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { editing ? await adminService.updateGiftItem(editing._id, draft) : await adminService.createGiftItem(draft); toast.success(editing ? 'Gift item updated' : 'Gift item created'); setOpen(false); await load(); } catch (error: unknown) { toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not save gift item'); } finally { setSaving(false); } };
  const remove = async (item: GiftItem) => { if (!confirm(`Delete gift item “${item.name}”?`)) return; try { await adminService.deleteGiftItem(item._id); toast.success('Gift item deleted'); await load(); } catch { toast.error('Could not delete gift item'); } };

  if (loading) return <LoadingSpinner label="Loading gift inventory…" />;
  const value = items.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  return <div><AdminPageHeader title="Gift Inventory" description={`${items.reduce((sum, item) => sum + item.stock, 0)} units in stock · ${formatPrice(value)} inventory value`} action={<button onClick={() => showForm()} className="btn-primary btn-sm gap-2"><Plus className="h-4 w-4" />Add Gift Item</button>} />
    <div className="overflow-hidden rounded-2xl border border-border bg-white">{items.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground"><Gift className="mx-auto mb-3 h-8 w-8" />No gift items added.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-surface text-left"><tr><th className="px-4 py-3">Gift Item</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3 text-right">Unit Cost</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-right">Stock Value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item._id}><td className="px-4 py-3"><p className="font-medium">{item.name}</p>{item.notes && <p className="max-w-xs truncate text-xs text-muted-foreground">{item.notes}</p>}</td><td className="px-4 py-3 font-mono text-xs">{item.sku}</td><td className="px-4 py-3 text-right">{formatPrice(item.unitCost)}</td><td className={`px-4 py-3 text-right font-medium ${item.stock === 0 ? 'text-red-600' : ''}`}>{item.stock}</td><td className="px-4 py-3 text-right font-semibold">{formatPrice(item.stock * item.unitCost)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => showForm(item)} className="p-2 text-blue-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}</div>
    <AdminModal open={open} onClose={() => !saving && setOpen(false)} title={editing ? 'Edit Gift Item' : 'Add Gift Item'}><form onSubmit={submit} className="space-y-4"><div><label className="label">Name</label><input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-field" /></div><div><label className="label">SKU</label><input required value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })} className="input-field" /></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Unit cost (₹)</label><input required type="number" min="0" step="0.01" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} className="input-field" /></div><div><label className="label">Stock</label><input required type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} className="input-field" /></div></div><div><label className="label">Notes</label><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input-field resize-none" rows={3} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />Active</label><div className="flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button><button disabled={saving} className="btn-primary btn-sm">{saving ? 'Saving…' : 'Save Gift Item'}</button></div></form></AdminModal>
  </div>;
}
