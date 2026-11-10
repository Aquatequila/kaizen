import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'exercise-art/**'],
      manifest: {
        name: 'Kaizen Workout Tracker',
        short_name: 'Kaizen',
        description: 'A calm, offline-first workout tracker.',
        theme_color: '#0d1014',
        background_color: '#0d1014',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,json}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
    }),
  ],
});
