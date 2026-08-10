'use client';

import React from 'react';
import { APP_NAME, SHIPPING, LOYALTY, SOCIAL_LINKS } from '@/constants';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" description="Store configuration and account information" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Store Information</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Store Name</dt>
              <dd className="font-medium">{APP_NAME}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Support Email</dt>
              <dd className="font-medium">support@ppaura.in</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Free Shipping Threshold</dt>
              <dd className="font-medium">₹{SHIPPING.FREE_THRESHOLD}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Standard Shipping</dt>
              <dd className="font-medium">₹{SHIPPING.STANDARD_RATE}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">COD Charges</dt>
              <dd className="font-medium">₹{SHIPPING.COD_CHARGES}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Loyalty Points Rate</dt>
              <dd className="font-medium">{LOYALTY.POINTS_PER_RUPEE} pt / ₹1</dd>
            </div>
          </dl>
        </div>

        {/* Admin Account */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Admin Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium capitalize">{user?.role?.replace(/_/g, ' ')}</dd>
            </div>
          </dl>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl border border-border p-6 md:col-span-2">
          <h2 className="font-semibold text-foreground mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {Object.entries(SOCIAL_LINKS).map(([platform, url]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="capitalize font-medium text-foreground">{platform}</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline truncate max-w-[200px]">
                  {url}
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            To update store settings, modify environment variables and constants in the backend configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
