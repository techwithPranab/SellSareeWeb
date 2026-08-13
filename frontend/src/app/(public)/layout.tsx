'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/constants';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <main className="min-h-screen bg-surface">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${APP_URL}/#organization`,
                name: APP_NAME,
                url: APP_URL,
                description: APP_DESCRIPTION,
                email: 'support@ppaura.in',
              },
              {
                '@type': 'WebSite',
                '@id': `${APP_URL}/#website`,
                url: APP_URL,
                name: APP_NAME,
                publisher: { '@id': `${APP_URL}/#organization` },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${APP_URL}/products?search={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
