import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indian Sarees Online — Jamdani, Handloom & Bengali Sarees',
  description: 'Explore Indian sarees online from PP’s Aura: Jamdani, Bengali handloom, Bangladeshi Jamdani, Kardana Jamdani, silk and Tasar sarees.',
  keywords: ['Indian sarees online', 'Jamdani saree', 'handloom saree', 'Bengali saree', 'silk saree', 'Tasar saree'],
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Indian Sarees Online | PP’s Aura',
    description: 'Shop distinctive Jamdani, handloom, Bengali, silk and Tasar sarees online.',
    url: '/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
