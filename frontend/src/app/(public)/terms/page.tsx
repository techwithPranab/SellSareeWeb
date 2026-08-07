import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using the Rupkatha Sarees website and purchasing products.',
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using our website or placing an order."
    >
      <h2>Acceptance of Terms</h2>
      <p>
        By accessing or using the Rupkatha Sarees website, you agree to be bound by these Terms
        and Conditions. If you do not agree, please do not use our services.
      </p>

      <h2>Products & Pricing</h2>
      <ul>
        <li>All product images are for representation; slight colour variations may occur due to screen settings</li>
        <li>Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise</li>
        <li>We reserve the right to modify prices without prior notice</li>
        <li>Product availability is subject to stock and may change without notice</li>
      </ul>

      <h2>Orders & Payment</h2>
      <p>
        Placing an order constitutes an offer to purchase. We reserve the right to cancel orders
        due to pricing errors, stock unavailability, or suspected fraud. Payment must be completed
        at the time of order (except for COD orders).
      </p>

      <h2>Intellectual Property</h2>
      <p>
        All content on this website — including text, images, logos, and designs — is the property
        of Rupkatha Sarees and protected by copyright laws. Reproduction without written permission is prohibited.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Rupkatha Sarees shall not be liable for any indirect, incidental, or consequential damages
        arising from the use of our website or products, beyond the value of the purchased item.
      </p>

      <h2>Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to the
        exclusive jurisdiction of courts in Kolkata, West Bengal.
      </p>
    </ContentPage>
  );
}
