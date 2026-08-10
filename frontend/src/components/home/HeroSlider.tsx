'use client';

import React, { useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { bannerService } from '@/services/banner.service';
import { asRoute } from '@/utils/helpers';

interface Slide {
  id: number | string;
  title: string;
  subtitle: string;
  cta: string;
  href: Route;
  image: string;
  mobileImage?: string;
  badge?: string;
  accentColor: string;
}

const FALLBACK_SLIDES: Slide[] = [
  {
    id: 1,
    title: 'The Art of Jamdani',
    subtitle: 'Delicate motifs appear to float across the weave, shaped patiently by skilled artisan hands.',
    cta: 'Discover Jamdani',
    href: '/products?search=jamdani',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1800&q=85&auto=format&fit=crop',
    badge: 'Upcoming Collection',
    accentColor: '#b5451b',
  },
  {
    id: 2,
    title: 'Authentic Handloom Stories',
    subtitle: 'Sarees woven slowly and thoughtfully, celebrating the character of true handmade craft.',
    cta: 'Explore Handloom',
    href: '/products?category=handloom',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1800&q=85&auto=format&fit=crop',
    badge: 'Artisan Made',
    accentColor: '#c8813a',
  },
  {
    id: 3,
    title: 'Bangladeshi Jamdani Heritage',
    subtitle: 'A graceful expression of Bengal’s weaving legacy, rich with rhythmic motifs and timeless detail.',
    cta: 'View the Collection',
    href: '/products?search=bangladeshi%20jamdani',
    image: 'https://images.unsplash.com/photo-1618901185975-d59f7091bcfe?w=1800&q=85&auto=format&fit=crop',
    badge: 'Heritage Weave',
    accentColor: '#1e3a5f',
  },
  {
    id: 4,
    title: 'Kardana Jamdani Silk',
    subtitle: 'Lustrous silk, Jamdani artistry, and delicate kardana work come together for a festive statement.',
    cta: 'Preview the Edit',
    href: '/products?search=kardana%20jamdani%20silk',
    image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=1800&q=85&auto=format&fit=crop',
    badge: 'Festive Highlight',
    accentColor: '#7c3f58',
  },
  {
    id: 5,
    title: 'Naturally Elegant Tasar',
    subtitle: 'Earthy texture and a subtle natural sheen make Tasar an enduring choice for effortless elegance.',
    cta: 'Explore Tasar',
    href: '/products?search=tasar',
    image: 'https://images.unsplash.com/photo-1610189012906-4c0aa9b9781e?w=1800&q=85&auto=format&fit=crop',
    badge: 'Natural Silk',
    accentColor: '#8b6a3f',
  },
];

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    bannerService
      .getActiveCarouselSlides()
      .then(({ banners }) => {
        if (!isMounted || banners.length === 0) return;

        setSlides(
          banners.map((banner) => ({
            id: banner._id,
            title: banner.title,
            subtitle: banner.subtitle || 'Discover the latest from PP’s Aura.',
            cta: 'Explore Collection',
            href: asRoute(banner.link || '/products'),
            image: banner.image,
            mobileImage: banner.mobileImage,
            badge: 'Featured Collection',
            accentColor: '#b5451b',
          }))
        );
        setCurrent(0);
      })
      .catch(() => {
        // Keep the curated fallback slides if the API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const slide = slides[current];

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
            className={slide.mobileImage ? 'hidden object-cover object-center sm:block' : 'object-cover object-center'}
            sizes="100vw"
          />
          {slide.mobileImage && (
            <Image
              src={slide.mobileImage}
              alt={slide.title}
              fill
              priority
              className="object-cover object-center sm:hidden"
              sizes="100vw"
            />
          )}
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((s, i) => (
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
