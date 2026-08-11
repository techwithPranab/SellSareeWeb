import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Discover PP’s Aura — distinctive, thoughtfully selected and affordable sarees for every woman and every occasion.',
};

export default function AboutPage() {
  return (
    <ContentPage
      title="Our Story"
      subtitle="Every Saree Has a Story. Find Your Aura. ✨"
    >
      <p className="lead">
        At <strong>PP’s Aura</strong>, we believe every woman deserves a saree that feels as unique
        and special as she is.
      </p>

      <h2>Our Mission</h2>
      <p>
        Our mission is simple — to bring you a thoughtfully curated collection of
        <strong> beautiful, distinctive and affordable sarees</strong> for every occasion.
        Whether it&apos;s a festival, wedding, celebration, office event or a simple day when you
        want to feel special, we want you to find your perfect saree at PP’s Aura.
      </p>

      <h2>❤️ What Makes PP’s Aura Special?</h2>
      <ul>
        <li>✨ Unique and carefully selected saree collections</li>
        <li>✨ Styles for every occasion</li>
        <li>✨ Beautiful choices at affordable prices</li>
        <li>✨ Simple and hassle-free ordering</li>
        <li>✨ Friendly and responsive customer service</li>
        <li>✨ Your feedback helps us serve you better</li>
      </ul>

      <p>
        For us, it&apos;s not just about selling a saree. It&apos;s about helping you find something
        you&apos;ll love wearing and feel confident in.
      </p>

      <blockquote>
        <p><strong>Every Saree Has a Story. Find Your Aura. ✨</strong></p>
      </blockquote>

      <p>
        📩 <strong>DM us to order or know more about our collections.</strong>
      </p>
    </ContentPage>
  );
}
