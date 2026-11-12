import { expect, test } from 'vitest'
import { createGame } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { runSummary } from '../src/game/runSummary'

const ended = (state: 'over' | 'won') =>
  Object.assign(createGame(createRecords(null)), { state, score: 412.87, level: 3, rescued: 5, missed: 2, time: 61.2345 })

test('SUM-01 a lost run', () => {
  expect(runSummary(ended('over'))).toEqual({
    outcome: 'over', distance: 412, level: 3, rescued: 5, missed: 2, durationSeconds: 61.2,
  })
})

test('SUM-02 a finished mission', () => {
  expect(runSummary(ended('won')).outcome).toBe('won')
})
