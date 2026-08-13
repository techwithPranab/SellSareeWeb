import type { MetadataRoute } from 'next';
import { API_URL, APP_URL } from '@/constants';
import type { Product } from '@/types';

const staticPages = ['', '/products', '/about', '/shipping-policy', '/privacy-policy', '/terms'];
const collectionPages = ['jamdani-sarees', 'handloom-sarees', 'bengali-sarees', 'indian-sarees', 'tasar-sarees'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/products' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : path === '/products' ? 0.9 : 0.5,
  }));
  staticEntries.push(...collectionPages.map((slug) => ({
    url: `${APP_URL}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  })));

  try {
    const response = await fetch(`${API_URL}/products?limit=1000&sortBy=updatedAt&sortOrder=desc`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return staticEntries;
    const payload = await response.json() as { data?: Product[] };
    const products = payload.data ?? [];
    return [
      ...staticEntries,
      ...products.map((product) => ({
        url: `${APP_URL}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        images: product.launchDate && new Date(product.launchDate).getTime() > Date.now()
          ? [`${APP_URL}/images/product-coming-soon.svg`]
          : product.images.map((image) => image.url),
      })),
    ];
  } catch {
    return staticEntries;
  }
}
