import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';
import { SHIPPING } from '@/constants';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping rates, delivery timelines, and coverage areas for PP’s Aura orders across India.',
};

export default function ShippingPolicyPage() {
  return (
    <ContentPage
      title="Shipping Policy"
      subtitle="Fast, secure delivery of your sarees anywhere in India."
    >
      <h2>Free Shipping</h2>
      <p>
        Enjoy <strong>free standard shipping</strong> on all orders above ₹{SHIPPING.FREE_THRESHOLD.toLocaleString('en-IN')}.
        Orders below this amount incur a standard shipping charge of ₹{SHIPPING.STANDARD_RATE}.
      </p>

      <h2>Delivery Timelines</h2>
      <ul>
        <li><strong>Standard Delivery:</strong> {SHIPPING.STANDARD_DAYS}–7 business days</li>
        <li><strong>Express Delivery:</strong> {SHIPPING.EXPRESS_DAYS}–3 business days (₹{SHIPPING.EXPRESS_RATE} additional)</li>
        <li><strong>Metro Cities:</strong> Typically 3–5 business days</li>
        <li><strong>Remote Areas:</strong> May take up to 10 business days</li>
      </ul>

      <h2>Order Tracking</h2>
      <p>
        Once your order ships, you&apos;ll receive an SMS and email with tracking details.
        You can also track your order from your account dashboard or our{' '}
        <a href="/track-order">Track Order</a> page.
      </p>

      <h2>Packaging</h2>
      <p>
        Every saree is carefully folded, wrapped in tissue paper, and placed in our signature
        eco-friendly box to ensure it arrives in perfect condition.
      </p>
    </ContentPage>
  );
}
