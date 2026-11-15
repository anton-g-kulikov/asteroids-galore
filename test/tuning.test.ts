import { expect, test } from 'vitest'
import {
  FIELD_H, FIELD_W, LAST_LEVEL, MAX_SHIELDS, SHIELDS, STEP, WORM_WAITS,
  FIRST_CHOICE, SHIPS, handling, levelTarget, rescueGap, shieldDrops, shipGrid, shipRadius, shipSeats, speedAt, startSpeed,
} from '../src/game/tuning'

const levels = [1, 2, 3, 4, 5, 6, 7]

test('TUNE-01 parsec target per level', () => {
  expect(LAST_LEVEL).toBe(7)
  expect(levels.map(levelTarget)).toEqual([500, 750, 1250, 2000, 2500, 3000, 3500])
})

const ships = [1, 2, 3, 4, 5]

test('TUNE-02 five ships, each with twice the seats of the one before, in a full rectangle', () => {
  expect([SHIPS, FIRST_CHOICE]).toEqual([5, 2])
  expect(ships.map(shipSeats)).toEqual([2, 4, 8, 16, 32])
  expect(ships.map(shipGrid)).toEqual([[1, 2], [2, 2], [2, 4], [4, 4], [4, 8]])
  for (const s of ships) expect(shipGrid(s)[0] * shipGrid(s)[1]).toBe(shipSeats(s))   // no part-filled row
})

test('TUNE-03 steering speed belongs to the ship: 100% in the smallest, 10% less with every step up', () => {
  expect(ships.map(handling)).toEqual([1, 0.9, 0.8, 0.7, 0.6])
})

test('TUNE-04 ship radius belongs to the ship: 13 to 23, every step easy to see', () => {
  const sizes = ships.map(shipRadius)
  expect(sizes).toEqual([13, 15, 17.5, 20, 23])
  for (let i = 1; i < sizes.length; i++) expect(sizes[i] / sizes[i - 1]).toBeGreaterThan(1.1)
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

test('TUNE-07 shields: 3 to start, 5 at most; drops on missions 4, 5 and 6 only', () => {
  expect([SHIELDS, MAX_SHIELDS]).toEqual([3, 5])
  expect(levels.map(shieldDrops)).toEqual([0, 0, 0, 2, 6, 4, 0])
})

test('TUNE-08 the same game on every device: one field, one step, one set of wormhole waits', () => {
  expect([FIELD_W, FIELD_H]).toEqual([400, 720])
  expect(STEP).toBe(1 / 60)
  expect(WORM_WAITS).toEqual([16, 19, 22, 25, 28])
})
