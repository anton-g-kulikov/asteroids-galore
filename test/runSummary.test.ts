import { expect, test } from 'vitest'
import { createGame } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { runSummary } from '../src/game/runSummary'
import { missionScore, pendingScore, runScore } from '../src/game/score'
import type { LevelResult } from '../src/game/types'

const m = (distance: number, saved: number, missed = 0, lost?: number): LevelResult => ({ level: 1, distance, saved, missed, lost })

const ended = (state: 'over' | 'won', extra: object) =>
  Object.assign(createGame(createRecords(null)), { state, distance: 412.87, level: 3, missed: 2, time: 61.2345 }, extra)

test('SUM-01 a lost run: its missions added up, the crash counted against it', () => {
  const run = runSummary(ended('over', { saved: 5, lost: 2, results: [m(300, 5, 1), m(112, 0, 1, 2)] }))
  expect(run).toEqual({
    outcome: 'over', score: 1350 - 224, distance: 412, level: 3, saved: 5, lost: 2, missed: 2, durationSeconds: 61.2,
  })
})

test('SUM-02 a finished mission', () => {
  const run = runSummary(ended('won', { saved: 9, lost: 0, results: [m(200, 4), m(212, 5)] }))
  expect([run.outcome, run.score]).toEqual(['won', 800 + 1060])
})

test('SCORE-01 a mission scores its own parsecs times its own crew; nobody saved scores nothing', () => {
  expect(missionScore(m(2140, 12))).toBe(2140 * 12)
  expect(missionScore(m(5000, 0))).toBe(0)
  expect(missionScore(m(0, 7))).toBe(0)
})

test('SCORE-02 a crash costs that mission\'s parsecs times the crew lost; the run never goes below zero', () => {
  expect(missionScore(m(250, 0, 3, 4))).toBe(-1000)            // missed crew do not soften it
  expect(runScore([m(600, 9), m(250, 0, 0, 4)])).toBe(5400 - 1000)
  expect(runScore([m(100, 1), m(250, 0, 0, 4)])).toBe(0)
})

test('SCORE-03 every crew member left behind takes 10% off the mission, down to nothing', () => {
  expect(missionScore(m(2082, 2, 4))).toBe(2498)               // 4,164 less 40%, rounded down
  expect(missionScore(m(1000, 3, 1))).toBe(2700)
  expect(missionScore(m(1000, 3, 10))).toBe(0)
  expect(missionScore(m(1000, 3, 14))).toBe(0)
})

test('SCORE-04 the run is its missions added up: parsecs do not multiply another mission\'s crew', () => {
  expect(runScore([m(2000, 2), m(500, 10)])).toBe(4000 + 5000)   // not 2,500 x 12
  expect(runScore([])).toBe(0)
})

test('SCORE-05 crew on board are worth this mission\'s parsecs so far, less what it has missed', () => {
  const g = Object.assign(createGame(createRecords(null)), { distance: 1300.6, missed: 5, onboard: 3, levelFrom: { distance: 900, missed: 3 } })
  expect(pendingScore(g)).toBe(400 * 3 * 0.8)
})
