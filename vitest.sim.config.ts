import { defineConfig } from 'vitest/config'

// Headless simulations of rules not yet in the game (sim/). Slow; run on demand with `npm run sim:story`, never by `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['sim/**/*.sim.ts'],
  },
})
