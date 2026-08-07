import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Saree length, blouse measurements, and sizing guide for Rupkatha Sarees.',
};

export default function SizeGuidePage() {
  return (
    <ContentPage
      title="Size Guide"
      subtitle="Understanding saree dimensions to find your perfect fit."
    >
      <h2>Standard Saree Lengths</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
          <thead className="bg-surface">
            <tr>
              <th className="text-left p-3 font-semibold">Type</th>
              <th className="text-left p-3 font-semibold">Length</th>
              <th className="text-left p-3 font-semibold">Best For</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Standard', '5.5 metres (18 ft)', 'Most women, all draping styles'],
              ['Tall / Plus', '6.0 metres (20 ft)', 'Height above 5\'8" or fuller figures'],
              ['Half Saree', '2.5 metres (8 ft)', 'Lehenga-style draping'],
              ['Mundum Neriyathum', '4.0 metres (13 ft)', 'Kerala Kasavu style'],
            ].map(([type, length, best]) => (
              <tr key={type} className="border-t border-border">
                <td className="p-3 font-medium">{type}</td>
                <td className="p-3">{length}</td>
                <td className="p-3 text-muted-foreground">{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Blouse Measurements</h2>
      <p>
        Most of our sarees come with an unstitched blouse piece (approx. 0.8–1 metre).
        We recommend getting your blouse tailored for the best fit. Standard measurements:
      </p>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
          <thead className="bg-surface">
            <tr>
              <th className="text-left p-3 font-semibold">Size</th>
              <th className="text-left p-3 font-semibold">Bust (inches)</th>
              <th className="text-left p-3 font-semibold">Waist (inches)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['XS', '30–32', '24–26'],
              ['S', '32–34', '26–28'],
              ['M', '34–36', '28–30'],
              ['L', '36–38', '30–32'],
              ['XL', '38–40', '32–34'],
              ['XXL', '40–42', '34–36'],
            ].map(([size, bust, waist]) => (
              <tr key={size} className="border-t border-border">
                <td className="p-3 font-medium">{size}</td>
                <td className="p-3">{bust}</td>
                <td className="p-3">{waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Need Help?</h2>
      <p>
        Unsure about sizing? Our team is happy to help. WhatsApp us at{' '}
        <a href="tel:+919876543210">+91 98765 43210</a> or email{' '}
        <a href="mailto:support@rupkathasarees.com">support@rupkathasarees.com</a>.
      </p>
    </ContentPage>
  );
}
