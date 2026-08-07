'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Star } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  badge?: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Banarasi Bridal Collection',
    subtitle: 'Hand-woven silk sarees that carry centuries of artisan craftsmanship for your most cherished moments.',
    cta: 'Explore Collection',
    href: '/products?category=banarasi&occasion=wedding',
    image: '/images/hero/banarasi-bridal.jpg',
    badge: 'New Arrivals',
    accentColor: '#b5451b',
  },
  {
    id: 2,
    title: 'Kanjivaram Elegance',
    subtitle: 'Temple-inspired South Indian silk with rich zari borders that speak of royal heritage.',
    cta: 'Shop Kanjivaram',
    href: '/products?category=kanjivaram',
    image: '/images/hero/kanjivaram.jpg',
    badge: 'Best Sellers',
    accentColor: '#c8813a',
  },
  {
    id: 3,
    title: 'Bengal\'s Finest Tant',
    subtitle: 'Breathable handloom cotton sarees — the timeless pride of Bengal\'s master weavers.',
    cta: 'Discover Tant',
    href: '/products?category=tant',
    image: '/images/hero/tant.jpg',
    badge: 'Heritage Weaves',
    accentColor: '#1e3a5f',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  const slide = SLIDES[current];

  return (
    <section className="relative h-[70vh] min-h-[520px] max-h-[800px] overflow-hidden bg-[#1a0f0a]">
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-custom">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl"
            >
              {slide.badge && (
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4"
                  style={{ backgroundColor: slide.accentColor }}
                >
                  {slide.badge}
                </span>
              )}
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                {slide.title}
              </h1>
              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                {slide.subtitle}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 btn-primary btn-lg"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {slide.cta}
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Social proof strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="container-custom py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {[
            { icon: <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />, label: '4.9/5 Rating' },
            { icon: '🛡️', label: '100% Authentic' },
            { icon: '🚚', label: 'Free Shipping ₹1500+' },
            { icon: '↩️', label: '7-Day Returns' },
            { icon: '👩‍🎨', label: '500+ Artisan Weavers' },
            { icon: '📦', label: '10,000+ Orders Delivered' },
          ].map((item) => (
            <div key={typeof item.label === 'string' ? item.label : ''} className="flex items-center gap-1.5 text-white/80 text-xs whitespace-nowrap">
              {typeof item.icon === 'string' ? (
                <span>{item.icon}</span>
              ) : (
                item.icon
              )}
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
