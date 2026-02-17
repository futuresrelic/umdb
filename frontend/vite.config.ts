import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // In production VITE_API_URL = 'https://umdb-production.up.railway.app/api'
  // Point manifest icons at the backend so admin-configured icons show on the home screen.
  // The backend sends Cross-Origin-Resource-Policy: cross-origin so Chrome can fetch them.
  // Dev fallback: static files bundled with the frontend.
  const apiBase = env.VITE_API_URL ?? '';
  const iconSrc = (name: string) =>
    apiBase ? `${apiBase}/icons/${name}` : `/icons/${name}`;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
        manifest: {
          id: '/',
          scope: '/',
          name: 'UMDB - Universal Media Database',
          short_name: 'UMDB',
          description: 'Track and discover your physical media collection',
          theme_color: '#111827',
          background_color: '#111827',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          icons: [
            { src: iconSrc('icon-192.png'), sizes: '192x192', type: 'image/png' },
            { src: iconSrc('icon-512.png'), sizes: '512x512', type: 'image/png' },
            { src: iconSrc('icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2}', 'icons/*.png'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            },
            {
              urlPattern: /\/api\/images\/[^/]+$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'umdb-images',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 }
              }
            },
            {
              urlPattern: /\/api\/icons\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'umdb-icons',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 }
              }
            }
          ]
        }
      })
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  };
})
