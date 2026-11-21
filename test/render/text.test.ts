import { expect, test } from 'vitest'
import { outlined } from '../../src/render/text'

// TITLE-01
test('an outlined word is black inside, with a glowing line around it that ends crisp', () => {
  const calls: string[] = []
  const state: Record<string, unknown> = {}
  const ctx = new Proxy({}, {
    get: (_t, p) => p in state ? state[p as string] : (...args: unknown[]) => {
      calls.push(`${String(p)}:${String(args[0])}:${String(state.shadowBlur)}:${String(state.fillStyle)}`)
    },
    set: (_t, p, v) => { state[p as string] = v; return true },
  }) as CanvasRenderingContext2D
  outlined(ctx, 'LIGHTBOAT', 200, 242, 58)
  expect(calls).toEqual([
    'strokeText:LIGHTBOAT:14.5:undefined',   // the outline, glowing
    'fillText:LIGHTBOAT:0:#000000',          // black inside, no glow
    'strokeText:LIGHTBOAT:0:#000000',        // the line again, crisp
  ])
  expect(state.strokeStyle).toBe('#5ff5ff')  // the ship's own line colour
  expect(state.textAlign).toBe('center')
  expect(state.shadowBlur).toBe(0)           // the glow is off for whatever is drawn next
})
