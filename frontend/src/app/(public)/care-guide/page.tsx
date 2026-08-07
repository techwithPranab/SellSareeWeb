import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Care Instructions',
  description: 'How to wash, store, and maintain your silk, cotton, and handloom sarees.',
};

export default function CareGuidePage() {
  return (
    <ContentPage
      title="Saree Care Instructions"
      subtitle="Keep your precious sarees beautiful for years with proper care."
    >
      <h2>Silk Sarees</h2>
      <ul>
        <li>Dry clean only for the first 2–3 washes</li>
        <li>Store wrapped in muslin cloth, never in plastic</li>
        <li>Keep away from direct sunlight to prevent fading</li>
        <li>Refold every 3–4 months to avoid permanent crease lines</li>
        <li>Use neem leaves or cedar blocks to prevent moth damage</li>
      </ul>

      <h2>Cotton & Tant Sarees</h2>
      <ul>
        <li>Hand wash in cold water with mild detergent</li>
        <li>Do not wring — gently squeeze out water</li>
        <li>Dry in shade, never in direct sunlight</li>
        <li>Iron on medium heat while slightly damp</li>
        <li>Starch lightly for crisp pleats (optional)</li>
      </ul>

      <h2>Banarasi & Kanjivaram</h2>
      <ul>
        <li>Always dry clean — never machine wash</li>
        <li>Store hanging or rolled (never folded sharply on zari work)</li>
        <li>Keep zari side up when storing to prevent tarnishing</li>
        <li>Air out occasionally in a shaded, ventilated area</li>
        <li>Professional cleaning recommended annually</li>
      </ul>

      <h2>General Storage Tips</h2>
      <ul>
        <li>Use breathable cotton or muslin covers</li>
        <li>Store in a cool, dry place away from humidity</li>
        <li>Keep different fabric types separate</li>
        <li>Avoid hanging heavy silk sarees for long periods — roll instead</li>
        <li>Never store with naphthalene balls directly touching fabric</li>
      </ul>

      <h2>Stain Removal</h2>
      <p>
        For fresh stains, blot (don&apos;t rub) with a clean cloth. For oil stains on silk,
        sprinkle talcum powder and let sit before dry cleaning. Never use bleach or harsh
        chemicals on any saree fabric. When in doubt, consult a professional cleaner.
      </p>
    </ContentPage>
  );
}
