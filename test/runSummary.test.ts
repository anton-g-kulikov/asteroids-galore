import { expect, test } from 'vitest'
import { createGame } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { runSummary } from '../src/game/runSummary'
import { keptShare, missedPercent, missionScore, pendingScore, runScore } from '../src/game/score'
import { missCost } from '../src/game/tuning'
import type { LevelResult } from '../src/game/types'

const m = (distance: number, saved: number, missed = 0, lost?: number, ship = 1): LevelResult => ({ level: 1, ship, distance, saved, missed, lost })

const ended = (state: 'over' | 'won', extra: object) =>
  Object.assign(createGame(createRecords(null)), { state, distance: 412.87, level: 3, missed: 2, time: 61.2345 }, extra)

test('SUM-01 a lost run: what its finished missions banked, with nothing taken off for the crash, and the ship of each mission', () => {
  const run = runSummary(ended('over', { saved: 5, lost: 2, shipType: 2, results: [m(300, 5, 1), m(112, 0, 1, 2, 2)] }))
  expect(run).toEqual({
    outcome: 'over', score: 1425, distance: 412, level: 3, finalDistance: 0, ship: 2, saved: 5, lost: 2, missed: 2, ships: [1, 2], durationSeconds: 61.2,
  })
})

test('SUM-02 a run that went home: outcome `won`, and how far mission 7 went', () => {
  const run = runSummary(ended('won', {
    level: 7, distance: 9412.9, levelFrom: { distance: 5000.5, missed: 0 }, saved: 9, lost: 0, results: [m(200, 4), m(212, 5)],
  }))
  expect([run.outcome, run.score, run.level, run.finalDistance]).toEqual(['won', 800 + 1060, 7, 4412])
  // lost in mission 7: the same field says how far it got
  expect(runSummary(ended('over', { level: 7, distance: 9412.9, levelFrom: { distance: 5000.5, missed: 0 } })).finalDistance).toBe(4412)
})

test('SCORE-01 a mission scores its own parsecs times its own crew; nobody saved scores nothing', () => {
  expect(missionScore(m(2140, 12))).toBe(2140 * 12)
  expect(missionScore(m(5000, 0))).toBe(0)
  expect(missionScore(m(0, 7))).toBe(0)
})

test('SCORE-02 a destroyed ship loses only the mission in flight: it scores nothing and takes nothing off the rest', () => {
  expect(missionScore(m(250, 0, 3, 4))).toBe(0)
  expect(runScore([m(600, 9), m(250, 0, 0, 4)])).toBe(5400)
  expect(runScore([m(100, 1), m(928, 0, 2, 9)])).toBe(100)
})

test('SCORE-03 a crew member left behind takes 5% of the mission\'s score in ships 1-3, 3% in ship 4 and 1.5% in ship 5, down to nothing', () => {
  expect([1, 2, 3, 4, 5].map(missCost)).toEqual([0.05, 0.05, 0.05, 0.03, 0.015])
  for (const ship of [1, 2, 3]) {
    expect([0, 1, 2, 3, 5, 10, 19, 20, 1000].map(n => Math.round(keptShare(n, ship) * 100))).toEqual([100, 95, 90, 85, 75, 50, 5, 0, 0])
  }
  expect([1, 2, 6, 20, 1000].map(n => missedPercent(n, 1))).toEqual([5, 10, 30, 100, 100])
  // missing as many as the ship seats costs about half the mission in the two biggest ships
  expect([missedPercent(16, 4), missedPercent(32, 5)]).toEqual([48, 48])
  // a mission is worth nothing at 34 missed in ship 4 and 67 in ship 5
  expect([[33, 4], [66, 5]].map(([n, ship]) => missedPercent(n, ship))).toEqual([99, 99])
  expect([[34, 4], [67, 5]].map(([n, ship]) => keptShare(n, ship))).toEqual([0, 0])
  // ship 5 counts in halves: shown as they are, and the score uses the same figure
  expect([1, 2, 3].map(n => missedPercent(n, 5))).toEqual([1.5, 3, 4.5])
  expect(missionScore(m(4000, 30, 1, undefined, 5))).toBe(118200)      // 120,000 less 1.5%
  expect(missionScore(m(3000, 20, 15, undefined, 4))).toBe(33000)      // 60,000 less 45%
  // the cost follows the ship, whatever the mission: a small ship in mission 7 still pays 5%
  expect(missionScore({ level: 7, ship: 1, distance: 4000, saved: 2, missed: 1 })).toBe(7600)
  expect(missionScore(m(1000, 3, 1))).toBe(2850)                 // 3,000 less 5%
  expect(missionScore(m(2082, 2, 4))).toBe(3331)                 // 4,164 less 20%
  expect(missionScore(m(1000, 3, 500))).toBe(0)                  // never below nothing
})

test('SCORE-04 the run is its missions added up: parsecs do not multiply another mission\'s crew', () => {
  expect(runScore([m(2000, 2), m(500, 10)])).toBe(4000 + 5000)   // not 2,500 x 12
  expect(runScore([])).toBe(0)
})

test('SCORE-05 crew on board are worth this mission\'s parsecs so far, less what it has missed', () => {
  const g = Object.assign(createGame(createRecords(null)), { distance: 1300.6, missed: 5, onboard: 3, levelFrom: { distance: 900, missed: 3 } })
  expect(pendingScore(g)).toBe(400 * 3 * 0.9)
})
