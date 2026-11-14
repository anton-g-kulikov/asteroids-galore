import type { ManifestOptions } from 'vite-plugin-pwa'

/** The game's dark background, also the page's `theme-color` in index.html. */
const SPACE = '#05060d'

/**
 * The web app manifest. vite.config.ts hands it to vite-plugin-pwa, which
 * writes it to dist/manifest.webmanifest and links it from index.html.
 * Icons are drawn by scripts/make-icons.mjs.
 */
export const manifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'Asteroids Galore',
  short_name: 'Asteroids',
  description: 'A small top-down space dodger for phones. No shooting — just flying.',
  start_url: '/',
  scope: '/',
  display: 'fullscreen',
  orientation: 'portrait',
  background_color: SPACE,
  theme_color: SPACE,
  lang: 'en',
  categories: ['games'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}
