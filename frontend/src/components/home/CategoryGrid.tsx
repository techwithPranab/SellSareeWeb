import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SAREE_CATEGORIES } from '@/constants';

export default function CategoryGrid() {
  return (
    <section className="section-padding bg-surface">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Shop by Category
            </p>
            <h2 className="section-title">Explore Our Collections</h2>
            <p className="text-muted max-w-lg mt-2">
              From heirloom silks to everyday cottons — find the perfect saree for every occasion.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {SAREE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <span>{cat.icon}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/products" className="btn-outline">
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
}
