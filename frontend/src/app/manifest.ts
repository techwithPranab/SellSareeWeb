import type { MetadataRoute } from 'next';
import { APP_DESCRIPTION, APP_NAME } from '@/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff8f2',
    theme_color: '#b5451b',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
