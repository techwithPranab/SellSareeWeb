'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  CreditCard,
  Star,
  Hash,
  MessageCircle,
  FileCheck2,
  Truck,
  LogIn,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { userService } from '@/services/user.service';
import { settingService } from '@/services/setting.service';
import type { StoreSettings } from '@/services/admin.service';
import type { Review } from '@/types';
import { newsletterService } from '@/services/newsletter.service';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  fetchNewArrivals,
} from '@/features/products/productsSlice';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [homepageReviews, setHomepageReviews] = useState<Review[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { newArrivals, isLoading } = useAppSelector(
    (s) => s.products
  );

  useEffect(() => {
    dispatch(fetchNewArrivals());
    userService.getHomepageReviews().then(({ reviews }) => setHomepageReviews(reviews)).catch(() => setHomepageReviews([]));
    settingService.getStoreSettings().then(({ settings }) => setStoreSettings(settings)).catch(() => setStoreSettings(null));
  }, [dispatch]);

  const whatsappValue = storeSettings?.socialLinks?.whatsapp?.trim() ?? '';
  const whatsappDigits = whatsappValue.replace(/\D/g, '');
  const quickOrderMessage = encodeURIComponent("Hi PP's Aura! I would like to place a quick order. My saree SKU code is: ");
  const quickOrderUrl = whatsappValue
    ? (/^https?:\/\//i.test(whatsappValue)
        ? `${whatsappValue}${whatsappValue.includes('?') ? '&' : '?'}text=${quickOrderMessage}`
        : whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${quickOrderMessage}` : '')
    : '';
  const announcementDate = storeSettings?.upcomingSareeAnnouncementDate
    ? new Date(storeSettings.upcomingSareeAnnouncementDate)
    : null;
  const showUpcomingAnnouncement = Boolean(
    announcementDate
    && !Number.isNaN(announcementDate.getTime())
    && announcementDate.getTime() > Date.now()
  );

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const response = await newsletterService.subscribe(email);
      toast.success(response.message);
      setNewsletterEmail('');
    } catch (error: unknown) {
      const requestError = error as { response?: { data?: { message?: string } } };
      toast.error(requestError.response?.data?.message || 'Could not subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {showUpcomingAnnouncement && announcementDate && (
        <section className="border-b border-amber-200 bg-amber-50" aria-labelledby="upcoming-saree-launch-title">
          <div className="container-custom flex flex-col items-center justify-center gap-4 py-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Coming soon</p>
              <h2 id="upcoming-saree-launch-title" className="mt-1 font-playfair text-2xl font-bold text-foreground">
                Upcoming Saree Launch
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover our next saree launch on{' '}
                <strong className="text-foreground">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata',
                  }).format(announcementDate)} IST
                </strong>.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="bg-surface">
        <FeaturedProducts
          title="New Arrivals"
          subtitle="Fresh weaves from artisans across India — just landed in our collection"
          seeAllHref="/products?sort=newest"
          seeAllLabel="See All New Arrivals"
          products={newArrivals}
          isLoading={isLoading}
        />
      </section>

      {/* Quick Order via WhatsApp */}
      <section className="section-padding bg-[#24150f] text-white" aria-labelledby="quick-order-title">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Simple WhatsApp ordering</p>
            <h2 id="quick-order-title" className="font-playfair text-3xl font-bold sm:text-4xl">Quick Order Your Favourite Saree</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Found something beautiful? Note the SKU code and complete your order directly with us on WhatsApp.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Hash, title: 'Get the SKU Code', description: 'Open the saree details and note its unique SKU code.' },
              { icon: MessageCircle, title: 'Check Availability', description: 'Send the SKU to PP’s Aura on WhatsApp and confirm availability.' },
              { icon: FileCheck2, title: 'Pay & Share Proof', description: 'Complete the UPI payment and share the payment screenshot with us.' },
              { icon: Truck, title: 'Receive Your Saree', description: 'Enjoy free shipping with delivery expected within 3–5 days.' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <span className="absolute right-4 top-4 text-xs font-bold text-white/35">0{index + 1}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[#24150f]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-playfair text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{step.description}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {quickOrderUrl ? (
              <a href={quickOrderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Order on WhatsApp
              </a>
            ) : (
              <p className="rounded-lg border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
                WhatsApp ordering will be available once the business number is configured.
              </p>
            )}
            <span className="text-sm font-semibold text-secondary">Free Shipping · Delivery in 3–5 days</span>
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section className="section-padding bg-white" aria-labelledby="how-to-order-title">
        <div className="container-custom">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Simple &amp; convenient
            </p>
            <h2 id="how-to-order-title" className="section-title">How to Order</h2>
            <p className="section-subtitle">Your favourite saree is only four quick steps away.</p>
          </div>

          <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              {
                icon: Search,
                title: 'Choose Your Saree',
                description: 'Explore our collection and open a saree to view its details.',
              },
              {
                icon: ShoppingBag,
                title: 'Add to Your Bag',
                description: 'Select your preferred saree and add it to your shopping bag.',
              },
              {
                icon: LogIn,
                title: 'Login & Checkout Securely',
                description: 'Sign in or create an account, then choose your delivery address at checkout.',
              },
              {
                icon: CreditCard,
                title: 'Complete Your Payment',
                description: 'Pay securely using UPI and submit your payment details for verification.',
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative rounded-2xl border border-border bg-background p-6 text-center shadow-sm"
                >
                  <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-playfair text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Search-friendly collection discovery with useful internal links. */}
      <section className="section-padding bg-surface" aria-labelledby="explore-sarees-title">
        <div className="container-custom grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Find your perfect drape</p>
            <h2 id="explore-sarees-title" className="section-title">Explore Sarees Online by Weave &amp; Occasion</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Discover Indian apparel rooted in textile tradition—from Bengali Jamdani and lightweight Tant to handloom, silk and cotton sarees for weddings, festivals, work and everyday wear.
            </p>
          </div>
          <nav aria-label="Popular saree collections" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              ['Bengali Jamdani', '/collections/jamdani-sarees'],
              ['Handloom Sarees', '/collections/handloom-sarees'],
              ['Bengali Sarees', '/collections/bengali-sarees'],
              ['Silk Sarees', '/collections/silk-sarees'],
              ['Cotton Sarees', '/collections/cotton-sarees'],
              ['Tant Sarees', '/collections/tant-sarees'],
              ['Wedding Sarees', '/collections/wedding-sarees'],
              ['Festival Sarees', '/collections/festival-sarees'],
              ['Affordable Sarees', '/collections/affordable-sarees'],
            ] as const).map(([label, href]) => (
              <Link key={href} href={href} className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Admin-selected customer reviews. Hidden until genuine reviews are selected. */}
      {homepageReviews.length > 0 && <section className="section-padding bg-surface">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Customer Love
            </p>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageReviews.map((review) => {
              const productName = typeof review.product === 'object' ? review.product.name : undefined;
              return (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-card transition-shadow"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-gray-300'}`} />
                  ))}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{review.title}</h3>
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">
                  &quot;{review.comment}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{review.user?.name?.[0] || 'C'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.user?.name || 'Customer'}</p>
                    <p className="text-xs text-muted">{review.isVerifiedPurchase ? 'Verified purchase' : 'Customer review'}{productName ? ` • ${productName}` : ''}</p>
                  </div>
                </div>
              </motion.div>
            )})}
          </div>
        </div>
      </section>}

      {/* Newsletter */}
      <section className="section-padding bg-primary">
        <div className="container-custom">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-playfair text-3xl font-bold text-white mb-3">
              Join the PP’s Aura Family
            </h2>
            <p className="text-white/80 mb-6">
              Subscribe to get exclusive offers, new arrival alerts, and styling tips.
            </p>
            <form
              className="flex gap-3 max-w-md mx-auto"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                name="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/15 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 transition-colors"
              />
              <button type="submit" disabled={isSubscribing} className="btn-white shrink-0 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubscribing ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Subscribing…</> : 'Subscribe'}
              </button>
            </form>
            <p className="text-white/60 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </>
  );
}
