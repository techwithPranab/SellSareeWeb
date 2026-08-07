import type { Metadata } from 'next';
import ContentPage from '@/components/common/ContentPage';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Rupkatha Sarees team and help bring authentic Indian sarees to customers worldwide.',
};

const OPENINGS = [
  { title: 'E-Commerce Manager', location: 'Kolkata (Hybrid)', type: 'Full-time' },
  { title: 'Content Writer — Saree & Fashion', location: 'Remote', type: 'Full-time' },
  { title: 'Customer Support Executive', location: 'Kolkata', type: 'Full-time' },
  { title: 'Social Media Manager', location: 'Remote', type: 'Part-time' },
];

export default function CareersPage() {
  return (
    <ContentPage
      title="Careers at Rupkatha"
      subtitle="Join us in celebrating Indian craftsmanship and building the future of ethnic e-commerce."
    >
      <h2>Why Work With Us</h2>
      <p>
        At Rupkatha Sarees, you&apos;ll be part of a passionate team that bridges the gap between
        master weavers and saree lovers across India and the world. We offer competitive salaries,
        flexible work arrangements, and the satisfaction of supporting artisan communities.
      </p>

      <h2>Open Positions</h2>
      <div className="not-prose space-y-4 my-6">
        {OPENINGS.map((job) => (
          <div key={job.title} className="bg-white rounded-xl border border-border p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{job.title}</p>
              <p className="text-sm text-muted-foreground">{job.location} · {job.type}</p>
            </div>
            <a href="mailto:careers@rupkathasarees.com" className="btn-outline btn-sm">
              Apply Now
            </a>
          </div>
        ))}
      </div>

      <h2>How to Apply</h2>
      <p>
        Send your resume and a brief cover letter to{' '}
        <a href="mailto:careers@rupkathasarees.com">careers@rupkathasarees.com</a>.
        We review applications on a rolling basis and will get back to you within 5 business days.
      </p>
    </ContentPage>
  );
}
