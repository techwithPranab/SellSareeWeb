import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ContentPageProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export default function ContentPage({ title, subtitle, breadcrumb, children }: ContentPageProps) {
  return (
    <div className="container-custom py-10 md:py-14">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{breadcrumb ?? title}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
        )}
      </header>

      <div className="prose prose-stone max-w-none prose-headings:font-playfair prose-a:text-primary">
        {children}
      </div>
    </div>
  );
}
