import { expect, test } from 'vitest'
import { LAST_LEVEL, levelCapacity, levelHandling, levelTarget, rescueGap, shipRadius, speedAt } from '../src/game/tuning'

const levels = [1, 2, 3, 4]

test('TUNE-01 parsec target per level', () => {
  expect(LAST_LEVEL).toBe(4)
  expect(levels.map(levelTarget)).toEqual([500, 750, 1250, 2000])
})

test('TUNE-02 seats per level', () => {
  expect(levels.map(levelCapacity)).toEqual([2, 4, 8, 16])
  expect(levelCapacity(5)).toBe(32)
  expect(levelCapacity(9)).toBe(32)
})

test('TUNE-03 steering speed per level', () => {
  expect(levels.map(l => Math.round(levelHandling(l) * 100))).toEqual([100, 92, 85, 78])
  expect(levelHandling(40)).toBe(0.5)
})

test('TUNE-04 ship radius per level', () => {
  expect(levels.map(l => shipRadius(l, 1))).toEqual([13, 15, 17, 20])
  expect(shipRadius(9, 1)).toBe(22)
  expect(shipRadius(2, 0.5)).toBe(7.5)
})

test('TUNE-05 seconds between crews', () => {
  expect(levels.map(rescueGap)).toEqual([[11, 15], [15, 20], [15, 20], [15, 20]])
})

test('TUNE-06 first gear follows progress: 2.3x at the target, 4.5x at most; second gear adds 0.1x a second, up to 9x', () => {
  expect(speedAt(0, 0)).toBe(1)
  expect(speedAt(0.5, 0)).toBeCloseTo(1.65)
  expect(speedAt(1, 0)).toBeCloseTo(2.3)        // at the target, on every level
  expect(speedAt(2, 0)).toBeCloseTo(3.6)
  expect(speedAt(50, 0)).toBe(4.5)              // first gear alone stops here, however far
  expect(speedAt(2, 10)).toBeCloseTo(4.6)       // second gear stacks on first
  expect(speedAt(50, 9999)).toBe(9)
})
