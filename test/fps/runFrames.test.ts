import { expect, test } from 'vitest'
import { createRunFrames } from '../../src/fps/runFrames'

test('FPS-05 a run keeps its average frame rate in flight and its slowest whole second', () => {
  const r = createRunFrames()
  expect(r.result()).toBeNull()                                       // nothing flown yet
  r.start()
  for (let i = 0; i < 120; i++) r.frame(1 / 60, true)                 // 2 s at 60
  for (let i = 0; i < 30; i++) r.frame(1 / 30, true)                  // 1 s at 30
  for (let i = 0; i < 600; i++) r.frame(1 / 60, false)                // the stop between missions: not counted
  for (let i = 0; i < 60; i++) r.frame(1 / 60, true)                  // 1 s at 60
  expect(r.result()).toEqual({ fpsAvg: 53, fpsLow: 30 })               // 210 frames in 4 s; the slowest second drew 30
  // a new run starts afresh
  r.start()
  expect(r.result()).toBeNull()
  // under a second of flight: the low is the average
  for (let i = 0; i < 30; i++) r.frame(1 / 60, true)
  expect(r.result()).toEqual({ fpsAvg: 60, fpsLow: 60 })
  // nonsense frames are ignored
  r.frame(0, true); r.frame(-1, true); r.frame(NaN, true)
  expect(r.result()).toEqual({ fpsAvg: 60, fpsLow: 60 })
})

test('FPS-05 one long hitch shows in the slowest second, not as a single frame', () => {
  const r = createRunFrames()
  r.start()
  for (let i = 0; i < 59; i++) r.frame(1 / 60, true)
  r.frame(0.25, true)                                                 // a quarter-second stall
  for (let i = 0; i < 120; i++) r.frame(1 / 60, true)
  const { fpsAvg, fpsLow } = r.result()!
  expect(fpsLow).toBeLessThan(fpsAvg)
  expect(fpsLow).toBeGreaterThan(40)                                  // the second with the stall still drew most of its frames
})
