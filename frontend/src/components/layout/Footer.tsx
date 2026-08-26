'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/constants';
import { Instagram, Facebook, Youtube, MessageCircle, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { asRoute } from '@/utils/helpers';
import { settingService } from '@/services/setting.service';
import type { StoreSettings } from '@/services/admin.service';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    settingService.getStoreSettings().then(({ settings: loaded }) => setSettings(loaded)).catch(() => setSettings(null));
  }, []);

  const socialLinks = settings?.socialLinks ?? {};
  const whatsappValue = socialLinks.whatsapp?.trim();
  const whatsappDigits = whatsappValue?.replace(/\D/g, '') ?? '';
  const whatsappUrl = whatsappValue
    ? (/^https?:\/\//i.test(whatsappValue) ? whatsappValue : (whatsappDigits ? `https://wa.me/${whatsappDigits}` : ''))
    : '';
  const socialItems = [
    { name: 'Instagram', href: socialLinks.instagram, icon: Instagram },
    { name: 'Facebook', href: socialLinks.facebook, icon: Facebook },
    { name: 'Twitter', href: socialLinks.twitter, icon: ExternalLink },
    { name: 'YouTube', href: socialLinks.youtube, icon: Youtube },
    { name: 'Pinterest', href: socialLinks.pinterest, icon: ExternalLink },
    { name: 'WhatsApp', href: whatsappUrl, icon: MessageCircle },
  ].filter((item) => item.href);

  return (
    <footer className="bg-[#1a0f0a] text-[#d4b895] mt-auto">
      {/* Main Footer */}
      <div className="container-custom py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/images/pp-aura-mark.png" alt="" width={36} height={36} sizes="36px" className="h-9 w-9 object-contain" />
            <span className="font-playfair font-bold text-xl text-white">{settings?.storeName || APP_NAME}</span>
          </div>
          <p className="text-sm leading-relaxed text-[#b09070] mb-6">
            Distinctive Indian sarees for every occasion, including Jamdani, Bengali handloom,
            silk and Tasar collections.
          </p>
          {socialItems.length > 0 && <div className="flex items-center gap-3">
            {socialItems.map(({ name, href, icon: Icon }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label={name}><Icon className="w-4 h-4 text-white" /></a>)}
          </div>}
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2.5">
            {[
              { label: 'Cotton Sarees', href: '/collections/cotton-sarees' },
              { label: 'Jamdani Sarees', href: '/collections/jamdani-sarees' },
              { label: 'Handloom Sarees', href: '/collections/handloom-sarees' },
              { label: 'New Arrivals', href: '/products?isNewArrival=true' },
              { label: 'Our Story', href: '/about' },
            ].map((item) => (
              <li key={item.href}>
                <Link href={asRoute(item.href)} className="text-sm text-[#b09070] hover:text-primary transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help & Contact */}
        <div className="sm:col-span-2 lg:col-span-2">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Customer Care
          </h3>
          <ul className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2.5">
            {[
              { label: 'Track Your Order', href: '/track-order' },
              { label: 'Shipping Policy', href: '/shipping-policy' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Care Instructions', href: '/care-guide' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={asRoute(item.href)}
                  className="text-sm text-[#b09070] hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {settings && <div className="space-y-3 border-t border-white/10 pt-4">
            {settings.supportPhone && <a
              href={`tel:${settings.supportPhone.replace(/[^+\d]/g, '')}`}
              className="flex items-center gap-2 text-sm text-[#b09070] hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {settings.supportPhone}
            </a>}
            {settings.supportEmail && <a
              href={`mailto:${settings.supportEmail}`}
              className="flex items-center gap-2 text-sm text-[#b09070] hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {settings.supportEmail}
            </a>}
            {settings.storeAddress && <p className="flex items-start gap-2 text-sm text-[#b09070]">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              {settings.storeAddress}
            </p>}
          </div>}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6 flex flex-wrap gap-6 justify-center sm:justify-between items-center">
          <div className="flex gap-6 flex-wrap justify-center">
            {[
              { icon: '🔒', label: 'Secure Payments' },
              { icon: '🚚', label: 'Free Shipping' },
              { icon: '✅', label: '100% Authentic' },
              { icon: '🌿', label: 'Eco-Friendly' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-xs text-[#b09070]">
                <span className="text-base">{badge.icon}</span>
                {badge.label}
              </div>
            ))}
          </div>
          <div className="container-custom py-4 flex flex-col sm:flex-row gap-2 justify-between items-center text-xs text-[#b09070]">
             <p>© {currentYear} {settings?.storeName || APP_NAME}. All rights reserved.</p>
            {/* <img src="/images/payments/razorpay.svg" alt="Razorpay" className="h-6 opacity-70" />
            <img src="/images/payments/upi.svg" alt="UPI" className="h-5 opacity-70" />
            <img src="/images/payments/visa.svg" alt="Visa" className="h-5 opacity-70" />
            <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-5 opacity-70" />
           */}
           </div>
        </div>
      </div>

      {/* Bottom Bar */}
     
    </footer>
  );
}
