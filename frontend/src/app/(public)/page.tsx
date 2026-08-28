'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  CreditCard,
  Star,
} from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { userService } from '@/services/user.service';
import type { Review } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  fetchNewArrivals,
} from '@/features/products/productsSlice';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [homepageReviews, setHomepageReviews] = useState<Review[]>([]);
  const { newArrivals, isLoading } = useAppSelector(
    (s) => s.products
  );

  useEffect(() => {
    dispatch(fetchNewArrivals());
    userService.getHomepageReviews().then(({ reviews }) => setHomepageReviews(reviews)).catch(() => setHomepageReviews([]));
  }, [dispatch]);

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

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
