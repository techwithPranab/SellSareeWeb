'use client';

import React from 'react';
import DashboardGuard from '@/components/dashboard/DashboardGuard';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <div className="container-custom py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <DashboardSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </DashboardGuard>
  );
}
