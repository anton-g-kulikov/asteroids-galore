import { expect, test } from 'vitest'
import { timeScale } from '../src/game/timeScale'
import { SLOW_SCALE, SLOW_TIME } from '../src/game/tuning'

test('TIME-01 no slow motion means normal speed', () => {
  expect(timeScale(0)).toBe(1)
  expect(timeScale(-0.2)).toBe(1)
})

test('TIME-02 slow motion eases in, holds, and eases out', () => {
  expect(timeScale(SLOW_TIME)).toBe(1)                      // just triggered
  expect(timeScale(SLOW_TIME - 0.1)).toBeCloseTo(0.65)      // halfway in
  expect(timeScale(SLOW_TIME - 0.2)).toBeCloseTo(SLOW_SCALE)
  expect(timeScale(0.7)).toBeCloseTo(SLOW_SCALE)            // the depth
  expect(timeScale(0.225)).toBeCloseTo(0.65)                // halfway out
})
