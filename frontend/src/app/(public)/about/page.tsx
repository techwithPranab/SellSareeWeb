import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Learn about Rupkatha Sarees — our mission to bring authentic handcrafted sarees from master weavers across India.',
};

export default function AboutPage() {
  return (
    <ContentPage
      title="Our Story"
      subtitle="Where every thread tells a story — connecting artisans with saree lovers since 2020."
    >
      <h2>A Heritage of Handcraft</h2>
      <p>
        Rupkatha Sarees was born from a simple belief: every woman deserves access to authentic,
        beautifully crafted sarees without compromising on quality or fair pricing for artisans.
        Founded in Kolkata in 2020, we began by partnering with a handful of weaver families in
        Varanasi, Kanchipuram, and rural Bengal.
      </p>
      <p>
        Today, we work directly with over 200 artisan families across 12 states, ensuring that
        every saree in our collection is genuinely handcrafted — not mass-produced imitations.
      </p>

      <h2>Our Mission</h2>
      <p>
        To preserve India&apos;s rich textile heritage while empowering weavers with fair wages,
        direct market access, and sustainable livelihoods. Every purchase you make supports an
        artisan family and keeps centuries-old weaving traditions alive.
      </p>

      <h2>What Makes Us Different</h2>
      <ul>
        <li><strong>Direct from Weavers:</strong> No middlemen — we source directly from artisan cooperatives.</li>
        <li><strong>Authenticity Guaranteed:</strong> Every saree comes with a certificate of authenticity.</li>
        <li><strong>Curated Collections:</strong> Our expert team hand-picks each piece for quality and design.</li>
        <li><strong>Sustainable Packaging:</strong> Eco-friendly, reusable packaging for every order.</li>
      </ul>
    </ContentPage>
  );
}
