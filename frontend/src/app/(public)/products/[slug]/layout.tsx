import type { Metadata } from 'next';
import { API_URL, APP_NAME } from '@/constants';
import type { Product } from '@/types';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 900 },
    });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: { product?: Product } };
    return payload.data?.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: 'Saree Not Found', robots: { index: false, follow: true } };
  }

  const category = typeof product.category === 'object' ? product.category.name : '';
  const description = (product.metaDescription || product.shortDescription || product.description)
    .replace(/\s+/g, ' ')
    .slice(0, 160);
  const image = product.images[0]?.url;

  return {
    title: product.metaTitle || `${product.name}${category ? ` — ${category} Saree` : ' — Indian Saree'}`,
    description,
    keywords: [product.name, `${product.fabric} saree`, category, 'Indian saree', 'saree online'].filter(Boolean),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      url: `/products/${product.slug}`,
      title: product.name,
      description,
      siteName: APP_NAME,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
