import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  // Absolute asset paths: share links live at /s/{id}, where relative paths would break.
  base: '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['test/rules/**'],   // these need the emulator: npm run test:rules
  },
})
