import { expect, test } from 'vitest'
import { LAST_LEVEL, levelCapacity, levelHandling, levelTarget, rescueGap, shipRadius } from '../src/game/tuning'

const levels = [1, 2, 3, 4]

test('TUNE-01 parsec target per level', () => {
  expect(LAST_LEVEL).toBe(4)
  expect(levels.map(levelTarget)).toEqual([350, 450, 550, 650])
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
  expect(levels.map(rescueGap)).toEqual([[11, 15], [11, 15], [9, 13], [8, 11]])
})
