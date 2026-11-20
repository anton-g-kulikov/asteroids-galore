import { expect, test } from 'vitest'
import { FPS_KEY, createFpsSwitch, createFrameMeter } from '../../src/fps/meter'

// Feeds `n` frames `ms` apart.
const feed = (m: ReturnType<typeof createFrameMeter>, n: number, ms: number) => { for (let i = 0; i < n; i++) m.frame(ms / 1000) }

test('FPS-01 frames per second over the last half second, and the slowest recent frame', () => {
  const m = createFrameMeter()
  expect(m.reading()).toBeNull()
  feed(m, 120, 1000 / 60)
  expect(m.reading()).toEqual({ fps: 60, low: 60 })
  const slow = createFrameMeter()
  feed(slow, 60, 1000 / 30)
  expect(slow.reading()).toEqual({ fps: 30, low: 30 })
  // one long frame: the average dips for half a second, the low shows it for 3 seconds
  feed(m, 1, 100)
  expect(m.reading()!.low).toBe(10)
  expect(m.reading()!.fps).toBeLessThan(60)
  feed(m, 60, 1000 / 60)                 // a second later
  expect(m.reading()).toEqual({ fps: 60, low: 10 })
  feed(m, 125, 1000 / 60)                // past 3 seconds
  expect(m.reading()).toEqual({ fps: 60, low: 60 })
})

test('FPS-02 the switch is off by default, toggles, and is remembered', () => {
  const data = new Map<string, string>()
  const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
  const s = createFpsSwitch(store)
  expect(s.on).toBe(false)
  s.toggle()
  expect([s.on, data.get(FPS_KEY)]).toEqual([true, '1'])
  expect(createFpsSwitch(store).on).toBe(true)
  s.toggle()
  expect([s.on, data.get(FPS_KEY)]).toEqual([false, '0'])
  const broken = createFpsSwitch({ getItem() { throw new Error('x') }, setItem() { throw new Error('x') } })
  expect(broken.on).toBe(false)
  broken.toggle()
  expect(broken.on).toBe(true)
  expect(createFpsSwitch(null).on).toBe(false)
})
