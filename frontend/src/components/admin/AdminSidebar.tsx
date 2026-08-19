'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Image,
  BarChart3,
  Settings,
  Star,
  FolderOpen,
  Loader2,
  LogOut,
  Menu,
  X,
  ReceiptIndianRupee,
} from 'lucide-react';
import { cn, asRoute } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/banners', label: 'Homepage Carousel', icon: Image },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/expenses', label: 'Expense Tracker', icon: ReceiptIndianRupee },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout('/admin-login');
    } finally {
      setLoggingOut(false);
    }
  };

  const activeItem = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className="w-full shrink-0 lg:w-60">
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin Panel</p>
          <p className="truncate text-sm font-semibold text-foreground">{activeItem?.label || 'PP\'s Aura'}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a0f0a] text-white"
          aria-label="Open admin navigation"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        aria-label="Close admin navigation"
        onClick={() => setMobileOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] transition-opacity lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] transform bg-[#1a0f0a] text-[#d4b895] shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-full lg:translate-x-0 lg:bg-transparent lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full overflow-y-auto p-4 lg:sticky lg:top-6 lg:h-auto lg:rounded-2xl lg:bg-[#1a0f0a] lg:p-5">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-xs uppercase tracking-widest text-white/50">Admin Panel</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close admin navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={asRoute(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'hover:bg-white/10 text-[#d4b895]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          </nav>
          <div className="mt-4 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <LogOut className="h-4 w-4 shrink-0" />}
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
