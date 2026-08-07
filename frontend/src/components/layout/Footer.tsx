import React from 'react';
import Link from 'next/link';
import { APP_NAME, SOCIAL_LINKS, NAV_LINKS, SAREE_CATEGORIES } from '@/constants';
import { Instagram, Facebook, Youtube, MessageCircle, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const FOOTER_CATEGORIES = SAREE_CATEGORIES.slice(0, 6);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a0f0a] text-[#d4b895] mt-auto">
      {/* Main Footer */}
      <div className="container-custom py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-playfair font-bold text-base">R</span>
            </div>
            <span className="font-playfair font-bold text-xl text-white">{APP_NAME}</span>
          </div>
          <p className="text-sm leading-relaxed text-[#b09070] mb-6">
            Where every thread tells a story. Curating authentic handcrafted sarees from master
            weavers across India since 2020.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4 text-white" />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4 text-white" />
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4 text-white" />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2.5">
            {NAV_LINKS.filter((l) => !l.children).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[#b09070] hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/about" className="text-sm text-[#b09070] hover:text-primary transition-colors">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-sm text-[#b09070] hover:text-primary transition-colors">
                Saree Guide Blog
              </Link>
            </li>
            <li>
              <Link href="/careers" className="text-sm text-[#b09070] hover:text-primary transition-colors">
                Careers
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Popular Categories
          </h3>
          <ul className="space-y-2.5">
            {FOOTER_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="text-sm text-[#b09070] hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help & Contact */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
            Customer Care
          </h3>
          <ul className="space-y-2.5 mb-6">
            {[
              { label: 'Track Your Order', href: '/track-order' },
              { label: 'Returns & Exchanges', href: '/returns' },
              { label: 'Shipping Policy', href: '/shipping-policy' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Size Guide', href: '/size-guide' },
              { label: 'Care Instructions', href: '/care-guide' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-[#b09070] hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 text-sm text-[#b09070] hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 shrink-0" />
              +91 98765 43210
            </a>
            <a
              href="mailto:support@rupkathasarees.com"
              className="flex items-center gap-2 text-sm text-[#b09070] hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              support@rupkathasarees.com
            </a>
            <p className="flex items-start gap-2 text-sm text-[#b09070]">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              12 Silk Street, Kolkata — 700001, West Bengal
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6 flex flex-wrap gap-6 justify-center sm:justify-between items-center">
          <div className="flex gap-6 flex-wrap justify-center">
            {[
              { icon: '🔒', label: 'Secure Payments' },
              { icon: '🚚', label: 'Free Shipping ₹1500+' },
              { icon: '↩️', label: '7-Day Returns' },
              { icon: '✅', label: '100% Authentic' },
              { icon: '🌿', label: 'Eco-Friendly' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-xs text-[#b09070]">
                <span className="text-base">{badge.icon}</span>
                {badge.label}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <img src="/images/payments/razorpay.svg" alt="Razorpay" className="h-6 opacity-70" />
            <img src="/images/payments/upi.svg" alt="UPI" className="h-5 opacity-70" />
            <img src="/images/payments/visa.svg" alt="Visa" className="h-5 opacity-70" />
            <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-5 opacity-70" />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col sm:flex-row gap-2 justify-between items-center text-xs text-[#b09070]">
          <p>© {currentYear} {APP_NAME}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with ❤️ in India &nbsp;|&nbsp; Crafted for Indian Artisans
          </p>
        </div>
      </div>
    </footer>
  );
}
