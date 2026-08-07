import type { Metadata } from 'next';
import Link from 'next/link';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Saree Guide Blog',
  description: 'Expert guides on saree types, styling tips, fabric care, and Indian textile heritage.',
};

const POSTS = [
  {
    slug: 'banarasi-silk-guide',
    title: 'The Complete Guide to Banarasi Silk Sarees',
    excerpt: 'Discover the history, types, and how to identify authentic Banarasi silk from the looms of Varanasi.',
    date: 'May 15, 2025',
    category: 'Fabric Guide',
  },
  {
    slug: 'tant-saree-bengal',
    title: 'Tant Sarees: Bengal\'s Lightweight Treasure',
    excerpt: 'Everything you need to know about handloom Tant cotton sarees — perfect for the Indian summer.',
    date: 'April 28, 2025',
    category: 'Regional Styles',
  },
  {
    slug: 'saree-draping-styles',
    title: '5 Elegant Saree Draping Styles for Every Occasion',
    excerpt: 'From the classic Nivi drape to the modern pant-style — master these looks for weddings and festivals.',
    date: 'April 10, 2025',
    category: 'Styling Tips',
  },
  {
    slug: 'kanjivaram-buying-guide',
    title: 'How to Buy an Authentic Kanjivaram Saree',
    excerpt: 'Temple borders, zari tests, and what to look for when investing in a Kanjivaram silk saree.',
    date: 'March 22, 2025',
    category: 'Buying Guide',
  },
  {
    slug: 'bridal-saree-colors',
    title: 'Bridal Saree Colours and Their Meanings',
    excerpt: 'Red, maroon, gold, or ivory? Understand the symbolism behind traditional bridal saree colours.',
    date: 'March 5, 2025',
    category: 'Wedding',
  },
  {
    slug: 'silk-care-tips',
    title: 'How to Care for Your Silk Sarees',
    excerpt: 'Storage, washing, and maintenance tips to keep your precious silk sarees beautiful for generations.',
    date: 'February 18, 2025',
    category: 'Care Guide',
  },
];

export default function BlogPage() {
  return (
    <ContentPage
      title="Saree Guide Blog"
      subtitle="Expert tips, fabric guides, and styling inspiration for the modern saree lover."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
        {POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-2xl border border-border p-6 hover:shadow-card transition-shadow"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {post.category}
            </span>
            <h2 className="font-playfair text-xl font-bold text-foreground mt-2 mb-2">
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{post.date}</span>
              <Link href={`/blog/${post.slug}`} className="text-sm text-primary font-medium hover:underline">
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </ContentPage>
  );
}
