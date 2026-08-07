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
    default: `${APP_NAME} — Where Every Thread Tells a Story`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'saree', 'silk saree', 'cotton saree', 'banarasi saree', 'kanjivaram saree',
    'tant saree', 'bridal saree', 'bengali saree', 'Indian ethnic wear',
    'rupkatha sarees', 'handloom saree', 'online saree shopping',
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
        url: `${APP_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    creator: '@rupkathasarees',
    images: [`${APP_URL}/images/og-image.jpg`],
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
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
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
