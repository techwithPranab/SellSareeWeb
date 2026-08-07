'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, RotateCcw, Headphones, Star, ArrowRight } from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import {
  fetchFeaturedProducts,
  fetchNewArrivals,
  fetchBestSellers,
} from '@/features/products/productsSlice';

const TRUST_BADGES = [
  {
    icon: <Truck className="w-6 h-6 text-primary" />,
    title: 'Free Shipping',
    desc: 'On orders above ₹1,500',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    title: '100% Authentic',
    desc: 'Genuine handcrafted sarees',
  },
  {
    icon: <RotateCcw className="w-6 h-6 text-primary" />,
    title: '7-Day Returns',
    desc: 'Hassle-free return policy',
  },
  {
    icon: <Headphones className="w-6 h-6 text-primary" />,
    title: '24/7 Support',
    desc: 'We\'re always here for you',
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Delhi',
    rating: 5,
    review: 'The Banarasi silk saree I ordered for my wedding was absolutely stunning. The zari work is incredible and the quality exceeded my expectations. Rupkatha delivered exactly what they promised!',
    avatar: '/images/testimonials/t1.jpg',
    product: 'Bridal Banarasi Silk',
  },
  {
    id: 2,
    name: 'Meenakshi Iyer',
    location: 'Chennai',
    rating: 5,
    review: 'I\'ve been buying Kanjivaram sarees for years and this is by far the most authentic one I\'ve found online. The temple border design is exquisite. Will definitely order more!',
    avatar: '/images/testimonials/t2.jpg',
    product: 'Kanjivaram Temple Border',
  },
  {
    id: 3,
    name: 'Ruma Chatterjee',
    location: 'Kolkata',
    rating: 5,
    review: 'As a Bengali, I\'m very particular about Tant sarees. The quality from Rupkatha is outstanding — exactly like buying from a weaver\'s home. The packaging was also beautiful!',
    avatar: '/images/testimonials/t3.jpg',
    product: 'Handloom Tant Cotton',
  },
];

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { featuredProducts, newArrivals, bestSellers, isLoading } = useAppSelector(
    (s) => s.products
  );

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchNewArrivals());
    dispatch(fetchBestSellers());
  }, [dispatch]);

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Trust Badges */}
      <section className="border-b border-border bg-white">
        <div className="container-custom py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_BADGES.map((badge) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                {badge.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="text-xs text-muted">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Category Grid */}
      <CategoryGrid />

      {/* Featured Products */}
      <FeaturedProducts
        title="Featured Sarees"
        subtitle="Hand-picked masterpieces curated by our expert team"
        seeAllHref="/products?featured=true"
        seeAllLabel="View All Featured"
        products={featuredProducts}
        isLoading={isLoading}
      />

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

      {/* Banner CTA */}
      <section className="relative overflow-hidden bg-[#3d2b1f] py-20">
        <div
          className="absolute inset-0 opacity-10 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-secondary font-semibold tracking-widest text-sm uppercase mb-3">
              Limited Time Offer
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
              Bridal Season Sale
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8 text-lg">
              Get up to 30% off on our premium bridal collection. Crafted for your most cherished moments.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/products?category=bridal&onSale=true"
                className="btn-primary btn-lg"
              >
                Shop Bridal Collection
              </Link>
              <Link
                href="/products?onSale=true"
                className="btn-outline-white btn-lg"
              >
                View All Sale Items
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers */}
      <FeaturedProducts
        title="Best Sellers"
        subtitle="Our most-loved sarees — trusted by thousands of customers"
        seeAllHref="/products?sort=bestselling"
        seeAllLabel="See All Best Sellers"
        products={bestSellers}
        isLoading={isLoading}
      />

      {/* Testimonials */}
      <section className="section-padding bg-surface">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Customer Love
            </p>
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
              ))}
              <span className="text-sm text-muted ml-1">4.9/5 from 2,400+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-card transition-shadow"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">
                  &quot;{t.review}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted">{t.location} • Purchased: {t.product}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding bg-primary">
        <div className="container-custom">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-playfair text-3xl font-bold text-white mb-3">
              Join the Rupkatha Family
            </h2>
            <p className="text-white/80 mb-6">
              Subscribe to get exclusive offers, new arrival alerts, and styling tips. Get ₹100 off your first order!
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
