'use client';

import React from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="container-custom py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
