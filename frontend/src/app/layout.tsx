import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import { Toaster } from 'react-hot-toast';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@/constants';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `Sarees Online — Bengali Jamdani & Handloom Sarees | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'saree', 'Indian saree', 'Jamdani saree', 'handloom saree', 'Bengali saree',
    'Bangladeshi Jamdani', 'Kardana Jamdani', 'silk saree', 'Tasar saree',
    'saree online', 'buy sarees online', 'online saree shopping India', 'online Indian apparel',
    'wedding saree', 'festival saree', 'cotton saree', 'Tant saree', 'PP’s Aura',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [
      {
        url: `${APP_URL}/images/product-coming-soon.svg`,
        width: 900,
        height: 1200,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/images/product-coming-soon.svg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
  verification: {
    google: 'MLTyweSCdy-8COWssVRR-RhSTn67rkWcC-UuwBEoQCA',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#b5451b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <StoreProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'toast-custom',
              duration: 4000,
              style: {
                background: '#3d2b1f',
                color: '#fdf6ef',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
