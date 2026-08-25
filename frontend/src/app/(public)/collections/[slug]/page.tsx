import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { APP_NAME, APP_URL } from '@/constants';

const COLLECTIONS = {
  'jamdani-sarees': {
    name: 'Jamdani Sarees',
    query: 'Jamdani',
    title: 'Jamdani Sarees Online — Bengali & Bangladeshi Jamdani',
    description: 'Explore distinctive Jamdani sarees online at PP’s Aura, including Bengali Jamdani, Bangladeshi Jamdani and intricate Kardana Jamdani styles.',
    intro: 'Discover the artistry of Jamdani weaving through a thoughtfully selected collection made for celebrations, gifting and graceful everyday dressing.',
  },
  'handloom-sarees': {
    name: 'Handloom Sarees',
    query: 'Handloom',
    title: 'Handloom Sarees Online — Traditional Indian Weaves',
    description: 'Shop handloom sarees online from PP’s Aura. Discover distinctive Indian and Bengali handwoven sarees selected for beauty, comfort and character.',
    intro: 'Our handloom sarees celebrate texture, tradition and the individuality of woven fabric, with versatile choices for work, festivals and special occasions.',
  },
  'bengali-sarees': {
    name: 'Bengali Sarees',
    query: 'Bengali',
    title: 'Bengali Sarees Online — Jamdani & Handloom Styles',
    description: 'Buy Bengali sarees online at PP’s Aura. Explore elegant Jamdani and handloom sarees inspired by Bengal’s rich textile traditions.',
    intro: 'Find Bengali sarees with expressive motifs, graceful drape and timeless appeal—curated for festivals, family occasions and meaningful celebrations.',
  },
  'indian-sarees': {
    name: 'Indian Sarees',
    query: 'Saree',
    title: 'Indian Sarees Online — Distinctive Sarees for Every Occasion',
    description: 'Shop Indian sarees online at PP’s Aura. Explore Jamdani, handloom, Bengali, silk and Tasar sarees for festivals, weddings, work and celebrations.',
    intro: 'Explore a distinctive collection of Indian sarees selected to help every woman find a drape that feels personal, beautiful and comfortable.',
  },
  'tasar-sarees': {
    name: 'Tasar Sarees',
    query: 'Tasar',
    title: 'Tasar Sarees Online — Elegant Textured Silk Sarees',
    description: 'Explore Tasar sarees online at PP’s Aura. Shop elegant, naturally textured sarees for celebrations, office occasions and thoughtful gifting.',
    intro: 'Tasar sarees are loved for their distinctive texture and understated elegance, making them a refined choice across festive and formal occasions.',
  },
  'silk-sarees': {
    name: 'Silk Sarees', query: 'Silk',
    title: 'Silk Sarees Online — Elegant Indian Silk Sarees',
    description: 'Shop silk sarees online at PP’s Aura. Discover elegant Indian silk sarees for weddings, festivals, celebrations and thoughtful gifting.',
    intro: 'Discover silk sarees selected for their graceful drape, rich texture and timeless presence at weddings, festivals and special occasions.',
  },
  'cotton-sarees': {
    name: 'Cotton Sarees', query: 'Cotton',
    title: 'Cotton Sarees Online — Comfortable Everyday Sarees',
    description: 'Buy cotton sarees online from PP’s Aura. Explore breathable Indian and Bengali cotton sarees for work, puja and comfortable everyday wear.',
    intro: 'Explore breathable cotton sarees that bring together everyday comfort, expressive colour and an unmistakably Indian sense of style.',
  },
  'tant-sarees': {
    name: 'Tant Sarees', query: 'Tant',
    title: 'Bengali Tant Sarees Online — Traditional Cotton Sarees',
    description: 'Shop Bengali Tant sarees online at PP’s Aura. Find lightweight traditional cotton sarees for puja, festivals, work and daily wear.',
    intro: 'Bengali Tant sarees are admired for their light drape and traditional character, making them a natural choice for warm days and meaningful occasions.',
  },
  'wedding-sarees': {
    name: 'Wedding Sarees', query: 'Wedding',
    title: 'Wedding Sarees Online — Elegant Sarees for Celebrations',
    description: 'Explore wedding sarees online at PP’s Aura, with distinctive silk, Jamdani and handloom styles for ceremonies, receptions and wedding guests.',
    intro: 'Find a memorable saree for wedding ceremonies, receptions and family celebrations, curated with colour, elegance and occasion in mind.',
  },
  'festival-sarees': {
    name: 'Festival Sarees', query: 'Festival',
    title: 'Festival Sarees Online — Sarees for Puja & Celebrations',
    description: 'Shop festival sarees online at PP’s Aura. Discover Bengali, Jamdani, silk, cotton and handloom sarees for puja and Indian celebrations.',
    intro: 'Celebrate puja and festivals in sarees chosen for expressive colour, comfortable drape and a joyful connection to Indian tradition.',
  },
  'affordable-sarees': {
    name: 'Affordable Sarees', query: 'Saree',
    title: 'Affordable Sarees Online — Distinctive Indian Sarees',
    description: 'Discover affordable sarees online at PP’s Aura. Browse distinctive Indian, Bengali, Jamdani and handloom sarees at sensible prices.',
    intro: 'Beautiful sarees can be both distinctive and sensibly priced. Explore versatile drapes curated for celebrations, work, gifting and everyday style.',
  },
} as const;

type CollectionSlug = keyof typeof COLLECTIONS;

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = COLLECTIONS[slug as CollectionSlug];
  if (!collection) return { title: 'Collection Not Found', robots: { index: false } };
  return {
    title: collection.title,
    description: collection.description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: collection.title, description: collection.description, url: `/collections/${slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = COLLECTIONS[slug as CollectionSlug];
  if (!collection) notFound();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: `${APP_URL}/collections/${slug}`,
    isPartOf: { '@type': 'WebSite', name: APP_NAME, url: APP_URL },
  };

  return (
    <main className="container-custom py-12 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">PP’s Aura Collection</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold text-foreground md:text-5xl">{collection.name}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{collection.intro}</p>
        <Link href={`/products?search=${encodeURIComponent(collection.query)}`} className="btn-primary mt-8 inline-flex">
          Shop {collection.name}
        </Link>
      </div>
      <section className="mx-auto mt-16 max-w-4xl rounded-2xl border border-border bg-white p-6 md:p-8">
        <h2 className="font-playfair text-2xl font-bold text-foreground">Find Your Saree at PP’s Aura</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{collection.description}</p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Every saree is selected with attention to design, occasion and affordability. Browse the latest availability, launch dates and customer-approved reviews before choosing your aura.
        </p>
      </section>
    </main>
  );
}
