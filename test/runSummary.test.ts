import { expect, test } from 'vitest'
import { createGame } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { runSummary } from '../src/game/runSummary'
import { scoreFor } from '../src/game/score'

const ended = (state: 'over' | 'won', crew: { saved: number; lost: number }) =>
  Object.assign(createGame(createRecords(null)), { state, distance: 412.87, level: 3, missed: 2, time: 61.2345 }, crew)

test('SUM-01 a lost run: the crew who went down count against the score', () => {
  expect(runSummary(ended('over', { saved: 5, lost: 2 }))).toEqual({
    outcome: 'over', score: 412 * 3, distance: 412, level: 3, saved: 5, lost: 2, missed: 2, durationSeconds: 61.2,
  })
})

test('SUM-02 a finished mission', () => {
  const run = runSummary(ended('won', { saved: 9, lost: 0 }))
  expect([run.outcome, run.score]).toEqual(['won', 412 * 9])
})

test('SCORE-01 parsecs times crew saved; nobody saved scores nothing', () => {
  expect(scoreFor(2140.9, 12, 0)).toBe(2140 * 12)
  expect(scoreFor(5000, 0, 0)).toBe(0)
  expect(scoreFor(0, 7, 0)).toBe(0)
})

test('SCORE-02 crew lost with the ship are taken off, never below zero', () => {
  expect(scoreFor(1000, 9, 3)).toBe(6000)
  expect(scoreFor(1000, 3, 3)).toBe(0)
  expect(scoreFor(1000, 2, 8)).toBe(0)
})
