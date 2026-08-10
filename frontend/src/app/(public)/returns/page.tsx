import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: 'Information about return and exchange eligibility for PP’s Aura orders.',
};

export default function ReturnsPage() {
  return (
    <ContentPage
      title="Returns & Exchanges"
      subtitle="We want you to love your saree. If something isn't right, we're here to help."
    >
      <h2>Return Eligibility</h2>
      <p>
        Return requests are reviewed according to the eligibility conditions below. The saree must
        be in its original condition with all tags attached and packaging intact.
      </p>

      <h2>Eligible for Return</h2>
      <ul>
        <li>Unused sarees with original tags</li>
        <li>Products with manufacturing defects</li>
        <li>Wrong item delivered</li>
        <li>Significant colour or quality variation from listing</li>
      </ul>

      <h2>Not Eligible for Return</h2>
      <ul>
        <li>Customised or altered sarees</li>
        <li>Products marked as final sale</li>
        <li>Items damaged due to misuse or improper care</li>
        <li>Products without original packaging or tags</li>
      </ul>

      <h2>How to Initiate a Return</h2>
      <ol>
        <li>Log in to your account and go to <strong>My Orders</strong></li>
        <li>Select the order and click <strong>Request Return</strong></li>
        <li>Choose your reason and submit the request</li>
        <li>Our team will arrange a pickup within 2–3 business days</li>
        <li>Refund is processed within 5–7 business days after inspection</li>
      </ol>

      <h2>Exchanges</h2>
      <p>
        Exchanges are subject to availability. If your preferred replacement is unavailable,
        we&apos;ll issue a full refund instead. Contact us at{' '}
        <a href="mailto:support@ppaura.in">support@ppaura.in</a> for assistance.
      </p>
    </ContentPage>
  );
}
