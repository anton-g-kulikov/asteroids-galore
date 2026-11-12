import { defineConfig } from 'vitest/config'

// The Firestore rules tests. Run through `npm run test:rules`, which starts the emulator.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/rules/**/*.test.ts'],
    fileParallelism: false,
  },
})
