import { expect, test } from 'vitest'
import {
  FIELD_H, FIELD_W, LAST_LEVEL, MAX_SHIELDS, SHIELDS, STEP, WORM_WAITS,
  handling, levelCapacity, levelTarget, rescueGap, shieldDrops, shipRadius, speedAt, startSpeed,
} from '../src/game/tuning'

const levels = [1, 2, 3, 4, 5, 6, 7]

test('TUNE-01 parsec target per level', () => {
  expect(LAST_LEVEL).toBe(7)
  expect(levels.map(levelTarget)).toEqual([500, 750, 1250, 2000, 2500, 3000, 3500])
})

test('TUNE-02 seats per level', () => {
  expect(levels.map(levelCapacity)).toEqual([2, 4, 8, 16, 20, 24, 32])
})

test('TUNE-03 steering speed comes from the crew on board, not the level', () => {
  expect(handling(0)).toBe(1)
  expect(handling(32)).toBeCloseTo(0.6)
  expect(handling(99)).toBeCloseTo(0.6)
  const steps = [0, 2, 8, 16, 32].map(handling)
  expect(steps).toEqual([...steps].sort((a, b) => b - a))   // every crew member slows it
})

test('TUNE-04 ship radius comes from the crew on board: 13 empty, 22 full', () => {
  expect(shipRadius(0)).toBe(13)
  expect(shipRadius(32)).toBeCloseTo(22)
  expect(shipRadius(99)).toBeCloseTo(22)
  expect(shipRadius(16)).toBeGreaterThan(17)
  expect(shipRadius(16)).toBeLessThan(20)
})

test('TUNE-05 seconds between crews', () => {
  expect(levels.map(rescueGap)).toEqual([[11, 15], ...Array(6).fill([15, 20])])
})

test('TUNE-06 one speed slope in every mission: 1.3x over the target, from the mission\'s starting speed, with no ceiling', () => {
  expect(levels.map(startSpeed)).toEqual([1, 1, 1, 1, 1.4, 1.8, 2.2])
  expect(speedAt(1, 0)).toBe(1)
  expect(speedAt(1, 0.5)).toBeCloseTo(1.65)
  for (const l of levels) expect(speedAt(l, 1) - speedAt(l, 0)).toBeCloseTo(1.3)   // whatever the length
  expect(speedAt(7, 1)).toBeCloseTo(3.5)
  expect(speedAt(4, 3)).toBeCloseTo(4.9)        // no second gear, and nothing stops at 4.5x
  expect(speedAt(1, 50)).toBeCloseTo(66)
})

test('TUNE-07 shields: 3 to start, 5 at most; drops on missions 5 and 6 only', () => {
  expect([SHIELDS, MAX_SHIELDS]).toEqual([3, 5])
  expect(levels.map(shieldDrops)).toEqual([0, 0, 0, 0, 6, 4, 0])
})

test('TUNE-08 the same game on every device: one field, one step, one set of wormhole waits', () => {
  expect([FIELD_W, FIELD_H]).toEqual([400, 720])
  expect(STEP).toBe(1 / 60)
  expect(WORM_WAITS).toEqual([16, 19, 22, 25, 28])
})
