import { readFileSync } from 'node:fs'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { manifest } from './src/pwa/manifest.ts'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  // Absolute asset paths: share links live at /s/{id}, where relative paths would break.
  base: '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    // Installable and playable offline. The service worker precaches the whole
    // build; src/pwa/register.ts registers it and decides when an update applies.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Share links (/s/{id}) open the game offline too; Firebase's own /__/ paths are left alone.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },   // no service worker in `npm run dev`
    }),
  ],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['test/rules/**'],   // these need the emulator: npm run test:rules
  },
})
