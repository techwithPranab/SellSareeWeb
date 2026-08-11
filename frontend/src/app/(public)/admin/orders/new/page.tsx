'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileImage, Loader2, Minus, Plus, Search, ShoppingBag, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService } from '@/services/admin.service';
import { INDIAN_STATES, SHIPPING } from '@/constants';
import { asRoute, formatPrice } from '@/utils/helpers';
import type { Product, User } from '@/types';

type CustomerMode = 'existing' | 'new';
type OrderItemDraft = { productId: string; quantity: number };

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

export default function CreateWhatsAppOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing');
  const [customerId, setCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [productId, setProductId] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const paymentMethod = 'upi' as const;
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [notes, setNotes] = useState('Order received through WhatsApp');

  useEffect(() => {
    Promise.all([
      adminService.getProducts({ page: 1, limit: 100 }),
      adminService.getCustomers({ page: 1, limit: 100, role: 'customer' }),
    ])
      .then(([productResponse, customerResponse]) => {
        setProducts((productResponse.data ?? []).filter((product) => product.isActive && product.stock > 0));
        setCustomers(customerResponse.data ?? []);
      })
      .catch(() => toast.error('Could not load customers or products'))
      .finally(() => setLoading(false));
  }, []);

  const visibleCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(query))
    );
  }, [customerSearch, customers]);

  const selectedProducts = useMemo(
    () => items.map((item) => ({ ...item, product: products.find((product) => product._id === item.productId)! })),
    [items, products]
  );

  const subtotal = selectedProducts.reduce((total, item) => {
    const price = item.product?.salePrice || item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);
  const shippingCharge = subtotal >= SHIPPING.FREE_THRESHOLD ? 0 : SHIPPING.STANDARD_RATE;
  const estimatedTotal = subtotal + shippingCharge;

  const selectCustomer = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((entry) => entry._id === id);
    if (!customer) return;
    const defaultAddress = customer.addresses?.find((entry) => entry.isDefault) || customer.addresses?.[0];
    setAddress({
      ...EMPTY_ADDRESS,
      ...(defaultAddress || {}),
      fullName: defaultAddress?.fullName || customer.name,
      phone: defaultAddress?.phone || customer.phone || '',
      addressLine2: defaultAddress?.addressLine2 || '',
    });
  };

  const addProduct = () => {
    if (!productId) return;
    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { productId, quantity: 1 }];
    });
    setProductId('');
  };

  const updateQuantity = (id: string, quantity: number) => {
    const product = products.find((entry) => entry._id === id);
    const safeQuantity = Math.max(1, Math.min(quantity, product?.stock || 1));
    setItems((current) => current.map((item) => item.productId === id ? { ...item, quantity: safeQuantity } : item));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (customerMode === 'existing' && !customerId) {
      toast.error('Select a customer');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one product');
      return;
    }
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !/^[1-9]\d{5}$/.test(address.pincode)) {
      toast.error('Complete the delivery address with a valid pincode');
      return;
    }
    if (paymentScreenshot && paymentScreenshot.size > 5 * 1024 * 1024) {
      toast.error('Payment screenshot must be 5 MB or smaller');
      return;
    }

    setSaving(true);
    try {
      const { order } = await adminService.createOrderForCustomer({
        ...(customerMode === 'existing' ? { customerId } : { customer: newCustomer }),
        items,
        shippingAddress: address,
        paymentMethod,
        notes,
        transactionId: transactionId.trim() || undefined,
        paymentScreenshot: paymentScreenshot || undefined,
      });
      toast.success(`Order #${order.orderNumber} created`);
      router.push(asRoute(`/admin/orders/${order._id}`));
    } catch (error: unknown) {
      const requestError = error as { response?: { data?: { message?: string } } };
      toast.error(requestError.response?.data?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Preparing order form…" />;

  return (
    <div>
      <AdminPageHeader
        title="Create WhatsApp Order"
        description="Place an order on behalf of a customer from a WhatsApp conversation"
        backHref="/admin/orders"
      />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-foreground">Customer</h2>
              <div className="flex rounded-lg bg-surface p-1 text-xs font-medium">
                {(['existing', 'new'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCustomerMode(mode)}
                    className={`rounded-md px-3 py-1.5 capitalize ${customerMode === mode ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
                  >
                    {mode === 'existing' ? 'Existing customer' : 'New customer'}
                  </button>
                ))}
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search by name, email, or phone" className="input-field pl-10" />
                </div>
                <select value={customerId} onChange={(event) => selectCustomer(event.target.value)} className="input-field" required>
                  <option value="">Select customer</option>
                  {visibleCustomers.map((customer) => (
                    <option key={customer._id} value={customer._id}>{customer.name} — {customer.phone || customer.email}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="label">Name *</label><input required value={newCustomer.name} onChange={(event) => { setNewCustomer({ ...newCustomer, name: event.target.value }); setAddress({ ...address, fullName: event.target.value }); }} className="input-field" /></div>
                <div><label className="label">Email *</label><input required type="email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} className="input-field" /></div>
                <div><label className="label">WhatsApp phone *</label><input required inputMode="tel" value={newCustomer.phone} onChange={(event) => { setNewCustomer({ ...newCustomer, phone: event.target.value }); setAddress({ ...address, phone: event.target.value }); }} className="input-field" placeholder="9876543210" /></div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-5 font-semibold text-foreground">Products</h2>
            <div className="flex gap-3">
              <select value={productId} onChange={(event) => setProductId(event.target.value)} className="input-field flex-1">
                <option value="">Select a product</option>
                {products.map((product) => <option key={product._id} value={product._id}>{product.name} — {formatPrice(product.salePrice || product.price)} ({product.stock} available)</option>)}
              </select>
              <button type="button" onClick={addProduct} disabled={!productId} className="btn-primary btn-sm gap-1"><Plus className="h-4 w-4" /> Add</button>
            </div>

            <div className="mt-5 space-y-3">
              {selectedProducts.length === 0 ? (
                <div className="rounded-xl bg-surface p-8 text-center text-sm text-muted-foreground"><ShoppingBag className="mx-auto mb-2 h-6 w-6" />No products added yet.</div>
              ) : selectedProducts.map(({ product, productId: id, quantity }) => (
                <div key={id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{formatPrice(product.salePrice || product.price)} each</p></div>
                  <div className="flex items-center rounded-lg border border-border">
                    <button type="button" onClick={() => updateQuantity(id, quantity - 1)} className="p-2"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button type="button" onClick={() => updateQuantity(id, quantity + 1)} className="p-2"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="w-24 text-right text-sm font-semibold">{formatPrice((product.salePrice || product.price) * quantity)}</p>
                  <button type="button" onClick={() => setItems((current) => current.filter((item) => item.productId !== id))} className="p-2 text-red-500" aria-label={`Remove ${product.name}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-5 font-semibold text-foreground">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'pincode'] as const).map((field) => (
                <div key={field} className={field.startsWith('addressLine') ? 'sm:col-span-2' : ''}>
                  <label className="label">{{ fullName: 'Full name', phone: 'Phone', addressLine1: 'Address line 1', addressLine2: 'Address line 2', city: 'City', pincode: 'Pincode' }[field]} {field !== 'addressLine2' && '*'}</label>
                  <input required={field !== 'addressLine2'} value={address[field]} onChange={(event) => setAddress({ ...address, [field]: event.target.value })} className="input-field" />
                </div>
              ))}
              <div><label className="label">State *</label><select required value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} className="input-field"><option value="">Select state</option>{INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
              <div><label className="label">Country</label><input value={address.country} readOnly className="input-field bg-surface" /></div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-6 xl:sticky xl:top-6">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2 border-b border-border pb-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shippingCharge ? formatPrice(shippingCharge) : 'FREE'}</span></div>
          </div>
          <div className="flex justify-between py-4 font-bold"><span>Estimated total</span><span className="text-primary">{formatPrice(estimatedTotal)}</span></div>
          <div className="space-y-4 border-t border-border pt-4">
            <div><label className="label">Payment method</label><div className="input-field bg-surface text-sm">UPI / manually collected</div></div>
            <div className="space-y-4 rounded-xl border border-border bg-surface/50 p-4">
                <div>
                  <label className="label">Transaction ID / UTR</label>
                  <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} maxLength={150} className="input-field bg-white" placeholder="Enter payment reference" />
                </div>
                <div>
                  <label className="label">Payment screenshot</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-white p-3 text-sm text-muted-foreground hover:bg-primary/5">
                    <FileImage className="h-5 w-5 shrink-0 text-primary" />
                    <span className="min-w-0 truncate">{paymentScreenshot?.name || 'Choose payment screenshot'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => setPaymentScreenshot(event.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, or GIF up to 5 MB.</p>
                </div>
            </div>
            <div><label className="label">Internal notes</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="input-field resize-none" /></div>
            <button type="submit" disabled={saving} className="btn-primary w-full gap-2">{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><UserPlus className="h-4 w-4" /> Create customer order</>}</button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Final totals and stock are validated by the server when the order is created.</p>
        </aside>
      </form>
    </div>
  );
}
