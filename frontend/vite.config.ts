import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Only list files that actually exist in public/
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
        // Static icons served from the frontend's own origin — always reachable.
        // (Admin-configured icons update the favicon/apple-touch-icon in the HTML
        //  but the manifest must use static files so Chrome can validate them.)
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Only pre-cache built JS/CSS/HTML + static icons; exclude API routes
        globPatterns: ['**/*.{js,css,html,woff2}', 'icons/*.png'],
        // SPA fallback: serve index.html for any navigation not found in cache
        navigateFallback: '/index.html',
        // Don't intercept API or icon API requests with the navigation fallback
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // TMDB poster images
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // User-uploaded images from UMDB backend
            urlPattern: /\/api\/images\/[^/]+$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'umdb-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          },
          {
            // Dynamic favicon/icon endpoints — short cache, no offline
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
})
