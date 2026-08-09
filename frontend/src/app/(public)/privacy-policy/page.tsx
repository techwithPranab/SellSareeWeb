import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PP’s Aura collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      subtitle="Last updated: January 2025"
    >
      <p>
        PP’s Aura (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy.
        This policy explains how we collect, use, and safeguard your information when you use our website.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li><strong>Account Information:</strong> Name, email, phone number, and password when you register</li>
        <li><strong>Order Information:</strong> Shipping address, payment details, and order history</li>
        <li><strong>Usage Data:</strong> Pages visited, products viewed, and device information</li>
        <li><strong>Communications:</strong> Messages you send us via email, chat, or WhatsApp</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>Process and fulfil your orders</li>
        <li>Send order confirmations and shipping updates</li>
        <li>Provide customer support</li>
        <li>Send promotional offers (with your consent)</li>
        <li>Improve our website and product offerings</li>
        <li>Prevent fraud and ensure security</li>
      </ul>

      <h2>Data Security</h2>
      <p>
        We use industry-standard SSL encryption for all data transmission. Payment information is
        processed securely through Razorpay and is never stored on our servers. Access to personal
        data is restricted to authorised personnel only.
      </p>

      <h2>Your Rights</h2>
      <p>
        You have the right to access, correct, or delete your personal data. You may also opt out
        of marketing communications at any time. Contact us at{' '}
        <a href="mailto:privacy@rupkathasarees.com">privacy@rupkathasarees.com</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies to enhance your browsing experience, remember your preferences, and analyse
        site traffic. You can control cookie settings through your browser preferences.
      </p>
    </ContentPage>
  );
}
