'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BadgePercent,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  Search,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { launchService } from '@/services/launch.service';
import { userService } from '@/services/user.service';
import type { Review } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  fetchNewArrivals,
} from '@/features/products/productsSlice';

const LAUNCH_BENEFITS = [
  {
    icon: BadgePercent,
    title: 'Launch Day Discount',
    description: 'Receive an exclusive special discount reserved for registered customers.',
  },
  {
    icon: BellRing,
    title: 'First to Know',
    description: 'Get the launch announcement and collection updates directly in your inbox.',
  },
  {
    icon: Sparkles,
    title: 'Early Collection Access',
    description: 'Explore our first curated sarees before the wider launch-day rush.',
  },
  {
    icon: Gift,
    title: 'A Special Welcome',
    description: 'Enjoy launch-only surprises created for the first PP’s Aura community members.',
  },
];

const LAUNCH_TIME = new Date('2026-08-28T00:00:00+05:30').getTime();

const getLaunchCountdown = () => {
  const remaining = Math.max(0, LAUNCH_TIME - Date.now());
  return {
    remaining,
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
};

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [homepageReviews, setHomepageReviews] = useState<Review[]>([]);
  const [countdown, setCountdown] = useState<ReturnType<typeof getLaunchCountdown> | null>(null);
  const { newArrivals, isLoading } = useAppSelector(
    (s) => s.products
  );

  useEffect(() => {
    dispatch(fetchNewArrivals());
    userService.getHomepageReviews().then(({ reviews }) => setHomepageReviews(reviews)).catch(() => setHomepageReviews([]));
  }, [dispatch]);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getLaunchCountdown());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLaunchRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);

    try {
      const response = await launchService.register(registration);
      setIsRegistered(true);
      setRegistration({ name: '', email: '', phone: '' });
      toast.success(response.message);
    } catch {
      toast.error('We could not complete your registration. Please check your details and try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Launch Countdown */}
      <section className="border-b border-border bg-[#24150f] text-white" aria-labelledby="launch-countdown-title">
        <div className="container-custom py-7 text-center sm:py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Our debut collection arrives soon</p>
          <h2 id="launch-countdown-title" className="mt-2 font-playfair text-2xl font-bold sm:text-3xl">
            Countdown to Timeless Grace
          </h2>
          {countdown && (countdown.remaining > 0 ? (
            <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-2 sm:gap-4" role="timer" aria-live="off" aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds until launch`}>
              {[
                ['Days', countdown.days],
                ['Hours', countdown.hours],
                ['Minutes', countdown.minutes],
                ['Seconds', countdown.seconds],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-sm sm:py-4">
                  <span className="block font-playfair text-2xl font-bold tabular-nums text-secondary sm:text-4xl">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-white/65 sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 font-playfair text-xl text-secondary">The PP’s Aura collection is now live.</p>
          ))}
          <p className="mt-5 text-sm text-white/65">Launching 28th August, 2026</p>
        </div>
      </section>

      {/* Upcoming Launch Registration */}
      <section className="section-padding bg-[#3d2b1f] relative overflow-hidden">
        <div className="absolute -top-32 -right-28 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="container-custom relative z-10 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary">
              <CalendarDays className="h-4 w-4" />
              Upcoming Launch Date
            </div>
            <h2 className="font-playfair text-4xl font-bold text-white md:text-5xl">
              Something beautiful is being woven.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Our first PP’s Aura collection launches on 28th August, 2026. Register now to receive
              an early reminder and your launch-day special discount.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-[#3d2b1f]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Launch date</p>
                <p className="font-playfair text-xl font-semibold text-white">
                  28th August, 2026
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8"
          >
            {isRegistered ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-playfair text-3xl font-bold text-foreground">You’re on the list!</h3>
                <p className="mt-3 max-w-sm text-muted-foreground">
                  We’ll send your launch update and special discount details as soon as they are ready.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegistered(false)}
                  className="btn-outline mt-7"
                >
                  Register another person
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Reserve your offer</p>
                <h3 className="mt-2 font-playfair text-3xl font-bold text-foreground">
                  Register for a launch-day special discount
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your details and we’ll keep your launch benefit ready.
                </p>
                <form onSubmit={handleLaunchRegistration} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="launch-name" className="label">Name</label>
                    <input
                      id="launch-name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={100}
                      value={registration.name}
                      onChange={(event) => setRegistration({ ...registration, name: event.target.value })}
                      placeholder="Your full name"
                      className="input-field"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="launch-email" className="label">Email</label>
                      <input
                        id="launch-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={registration.email}
                        onChange={(event) => setRegistration({ ...registration, email: event.target.value })}
                        placeholder="you@example.com"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="launch-phone" className="label">Phone number</label>
                      <input
                        id="launch-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        minLength={8}
                        maxLength={20}
                        value={registration.phone}
                        onChange={(event) => setRegistration({ ...registration, phone: event.target.value })}
                        placeholder="+91 98765 43210"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isRegistering} className="btn-primary w-full">
                    {isRegistering ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…</>
                    ) : (
                      'Register for launch benefits'
                    )}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    By registering, you agree to receive launch updates from PP’s Aura.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Launch Benefits */}
      <section className="section-padding bg-surface">
        <div className="container-custom">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Made for our first community</p>
            <h2 className="section-title">Launch Benefits</h2>
            <p className="section-subtitle">Register once and be part of PP’s Aura from the very beginning.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LAUNCH_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.07 }}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

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

      {/* How to Order */}
      <section className="section-padding bg-white" aria-labelledby="how-to-order-title">
        <div className="container-custom">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Simple &amp; convenient
            </p>
            <h2 id="how-to-order-title" className="section-title">How to Order</h2>
            <p className="section-subtitle">Your favourite saree is only three quick steps away.</p>
          </div>

          <ol className="relative grid gap-5 md:grid-cols-3 md:gap-8">
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
                icon: CreditCard,
                title: 'Checkout Securely',
                description: 'Enter your delivery details and complete your payment.',
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
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/15 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 transition-colors"
              />
              <button type="submit" className="btn-white shrink-0">
                Subscribe
              </button>
            </form>
            <p className="text-white/60 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </>
  );
}
