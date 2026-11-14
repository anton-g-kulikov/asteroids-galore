import { expect, test } from 'vitest'
import { boardRows } from '../../src/cloud/leaderboard'
import type { RunEnd } from '../../src/game/types'

const home: RunEnd = { outcome: 'won', level: 7, finalDistance: 5400 }
const lost: RunEnd = { outcome: 'over', level: 3, finalDistance: 0 }

const top = [
  { uid: 'a', callsign: 'ALPHA ONE 01', value: 900, end: home },
  { uid: 'b', callsign: 'BRAVO TWO 02', value: 700, end: null },
  { uid: 'c', callsign: 'CHARLIE SIX 03', value: 500, end: lost },
]
const nobody = { uid: 'zz', callsign: 'NOBODY HERE 00', value: 0, end: null }

test('BOARD-01 rows are ranked from the highest value and cut to the limit', () => {
  expect(boardRows(top, nobody, 0, 2)).toEqual([
    { rank: 1, callsign: 'ALPHA ONE 01', value: 900, me: false, end: home },
    { rank: 2, callsign: 'BRAVO TWO 02', value: 700, me: false, end: null },
  ])
})

test('BOARD-02 the player\'s row uses their current best and is marked', () => {
  const rows = boardRows(top, { uid: 'c', callsign: 'CHARLIE SIX 03', value: 800, end: home }, 1, 5)
  expect(rows[1].end).toEqual(home)   // how the player's current best ended, not the server's stale copy
  expect(rows.map(r => [r.rank, r.callsign, r.value, r.me])).toEqual([
    [1, 'ALPHA ONE 01', 900, false],
    [2, 'CHARLIE SIX 03', 800, true],
    [3, 'BRAVO TWO 02', 700, false],
  ])
  // a new player enters the top
  expect(boardRows(top, { uid: 'n', callsign: 'NEW KID 09', value: 600, end: lost }, 2, 3).map(r => r.callsign))
    .toEqual(['ALPHA ONE 01', 'BRAVO TWO 02', 'NEW KID 09'])
})

test('BOARD-03 a player outside the top is added last with their rank', () => {
  const rows = boardRows(top, { uid: 'n', callsign: 'NEW KID 09', value: 120, end: lost }, 41, 3)
  expect(rows).toHaveLength(4)
  expect(rows[3]).toEqual({ rank: 42, callsign: 'NEW KID 09', value: 120, me: true, end: lost })
})

test('BOARD-04 no best yet: not listed; an empty board gives no rows', () => {
  expect(boardRows(top, nobody, 0, 5).some(r => r.me)).toBe(false)
  expect(boardRows([], nobody, 0, 5)).toEqual([])
})
