import { expect, test } from 'vitest'
import { createGame, layout } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { BoardRow, Game, GameState } from '../../src/game/types'
import { boardButtonRect, drawHud, shareButtonRect } from '../../src/render/hud'

const rows: BoardRow[] = [
  { rank: 1, callsign: 'COSMIC OTTER 42', value: 25680, me: false },
  { rank: 2, callsign: 'LUNAR FOX 07', value: 640, me: true },
]

// Draws the HUD onto a context that only remembers the text it was asked to draw.
function drawnText(state: GameState, board: BoardRow[] | null, extra: Partial<Game> = {}): string[] {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  Object.assign(g, { state, stateTime: 2, board }, extra)
  const out: string[] = []
  const ctx = new Proxy({}, {
    get: (_t, prop) => (...args: unknown[]) => { if (prop === 'fillText') out.push(String(args[0])) },
    set: () => true,
  }) as CanvasRenderingContext2D
  drawHud(ctx, g)
  return out
}

test('HUD-01 with a board loaded, both end screens show a link to it, not the board itself', () => {
  for (const state of ['over', 'won'] as const) {
    const text = drawnText(state, rows)
    expect(text).toContain('LEADERBOARD')
    expect(text).not.toContain('TOP SCORES')
    expect(text).not.toContain('COSMIC OTTER 42')
  }
  for (const state of ['menu', 'play', 'between'] as const) expect(drawnText(state, rows)).not.toContain('LEADERBOARD')
})

test('HUD-11 the leaderboard screen: every row by score, and a way back, in place of the end screen', () => {
  for (const state of ['over', 'won'] as const) {
    const text = drawnText(state, rows, { boardOpen: true })
    expect(text).toEqual(['TOP SCORES', '1', 'COSMIC OTTER 42', '25,680', '2', 'LUNAR FOX 07', '640', 'TAP TO GO BACK'])
  }
  // no board to show: the end screen stays, even if the flag is somehow set
  expect(drawnText('over', null, { boardOpen: true })).toContain('GAME OVER')
})

test('HUD-12 the leaderboard link sits top left, clear of the share button', () => {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  const b = boardButtonRect(g), sh = shareButtonRect(g)
  expect(b.x).toBeGreaterThanOrEqual(0)
  expect(b.x + b.w).toBeLessThan(sh.x)
  expect(b.y + b.h).toBeLessThan(g.H * 0.2)
  expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(40)   // comfortable to tap
  layout(g, 320, 568)                                      // a small phone
  expect(boardButtonRect(g).x + boardButtonRect(g).w).toBeLessThan(shareButtonRect(g).x)
})

test('HUD-02 an end screen is a table with a sum per mission, then the score they add up to', () => {
  const won = drawnText('won', null, {
    distance: 2140.6, saved: 12, lost: 0, missed: 7,
    results: [{ level: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, saved: 10, missed: 6, distance: 1779 }],
  })
  // each row: mission, distance, crew saved as a multiplier, what the missed cost, its score
  expect(won.slice(0, 16)).toEqual([
    'ALL MISSIONS COMPLETE', 'MISSION', 'DISTANCE', 'SAVED', 'MISSED', 'SCORE',
    '1', '361 pc', '×2', '1 (−10%)', '649',
    '2', '1779 pc', '×10', '6 (−60%)', '7,116',
  ])
  expect(won).toEqual(expect.arrayContaining(['SCORE', '7,765', 'NOT SAVED', '7 MISSED']))
  expect(won.join(' ')).not.toMatch(/WENT DOWN|LOST|TOTAL/)

  // a crash: the unfinished mission shows the crew it cost and a negative score
  const over = drawnText('over', null, {
    distance: 1000, saved: 9, lost: 3, missed: 2,
    results: [{ level: 1, saved: 9, missed: 0, distance: 600 }, { level: 2, saved: 0, lost: 3, missed: 2, distance: 400 }],
  })
  expect(over.slice(6, 15)).toEqual(['1', '600 pc', '×9', '—', '5,400', '2', '400 pc', '−3', '−1,200'])
  expect(over).toEqual(expect.arrayContaining(['GAME OVER', '4,200', 'NOT SAVED', '3 WENT DOWN WITH THE SHIP', '2 MISSED']))

  // the best comes straight after the score, before the crew who were not saved
  const best = drawnText('over', null, { results: [{ level: 1, saved: 3, missed: 0, distance: 2000 }], newBest: true })
  expect(best.slice(best.lastIndexOf('6,000'), best.lastIndexOf('6,000') + 3)).toEqual(['6,000', 'NEW BEST!', 'NOT SAVED'])

  // nobody saved: the score is nothing, however far the ship flew
  const none = drawnText('over', null, { distance: 3000, missed: 4, results: [{ level: 1, saved: 0, lost: 0, missed: 4, distance: 3000 }] })
  expect(none).toEqual(expect.arrayContaining(['3000 pc', '×0', '4 (−40%)', '0', '4 MISSED']))
})

test('HUD-03 no board, or an empty one: no link and no board', () => {
  for (const board of [null, []]) {
    for (const state of ['over', 'won'] as const) {
      const text = drawnText(state, board)
      expect(text.filter(t => t.startsWith('TOP ') || t === 'LEADERBOARD')).toEqual([])
    }
  }
})

const banked = [{ level: 1, saved: 3, missed: 0, distance: 400 }]

test('HUD-08 during a run the big number is the score, not the distance', () => {
  expect(drawnText('play', null, { distance: 400, saved: 0 })).not.toContain('0')   // nothing saved, nobody aboard: no number at all
  const text = drawnText('play', null, { distance: 400.9, saved: 3, missed: 1, results: banked })
  expect(text).toEqual(expect.arrayContaining(['1,200', 'SAVED 3', 'MISSED 1']))
  expect(text).not.toContain('400 pc')
})

test('HUD-09 one number at a time: what the crew on board are worth, or else the score', () => {
  // crew on board, nothing banked: the pending amount, and no "0"
  const waiting = drawnText('play', null, { distance: 350.4, saved: 0, onboard: 2 })
  expect(waiting).toContain('+700')
  expect(waiting).not.toContain('0')
  // crew on board and a score banked: still only the pending amount, from this mission's parsecs alone
  const from = { distance: 400, missed: 0 }
  const carrying = drawnText('play', null, { distance: 1400, saved: 3, onboard: 4, results: banked, levelFrom: from })
  expect(carrying).toContain('+4,000')
  expect(carrying).not.toContain('1,200')
  // a crew left behind on this mission takes 10% off what those on board are worth
  expect(drawnText('play', null, { distance: 1400, onboard: 4, missed: 1, results: banked, levelFrom: from })).toContain('+3,600')
  // empty seats: the score
  const empty = drawnText('play', null, { distance: 1400, saved: 3, onboard: 0, results: banked, levelFrom: from })
  expect(empty).toContain('1,200')
  expect(empty.some(t => t.startsWith('+'))).toBe(false)
})

test('HUD-10 between levels: the mission as a sum, and the run\'s score so far', () => {
  const text = drawnText('between', null, {
    level: 2, distance: 881.3, saved: 5,
    results: [{ level: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, saved: 3, missed: 0, distance: 520 }],
  })
  expect(text).toEqual([
    'MISSION 2 COMPLETE', 'DISTANCE', 'SAVED', 'MISSED', 'SCORE',
    'MISSION', '520 pc', '×3', '—', '1,560',   // the mission just finished: its own sum
    'TOTAL', '2,209',                          // the run so far: 649 + 1,560
    'TAP TO CONTINUE',
  ])   // the mission number appears once, in the title, and earlier missions are not listed
})

test('HUD-04 the share button appears on end screens only when a link is ready', () => {
  for (const state of ['over', 'won'] as const) {
    expect(drawnText(state, null)).not.toContain('SHARE')
    expect(drawnText(state, null, { shareReady: true })).toContain('SHARE')
    expect(drawnText(state, null, { shareReady: true, shareNote: 1.5 })).toContain('COPIED')
  }
  expect(drawnText('menu', null, { shareReady: true })).not.toContain('SHARE')
  expect(drawnText('play', null, { shareReady: true })).not.toContain('SHARE')
})

test('HUD-05 the button sits inside the play field, top right', () => {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  const r = shareButtonRect(g)
  expect(r.x).toBeGreaterThan(g.W / 2)
  expect(r.x + r.w).toBeLessThanOrEqual(g.W)
  expect(r.y).toBeGreaterThanOrEqual(0)
  expect(r.y + r.h).toBeLessThan(g.H * 0.2)
  expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(40)   // comfortable to tap
})

test('HUD-06 the start screen shows a shared run', () => {
  const won = drawnText('menu', null, { shared: { callsign: 'COSMIC OTTER 42', outcome: 'won', score: 29400, saved: 14, distance: 2100 } })
  expect(won).toEqual(expect.arrayContaining(['COSMIC OTTER 42', '29,400', 'ALL MISSIONS COMPLETE · 14 SAVED', 'TAP TO START']))
  const lost = drawnText('menu', null, { shared: { callsign: 'LUNAR FOX 07', outcome: 'over', score: 1128, saved: 2, distance: 564 } })
  expect(lost).toEqual(expect.arrayContaining(['LUNAR FOX 07', '1,128', '2 SAVED · 564 pc']))
})

test('HUD-07 with no shared run the start screen draws nothing extra', () => {
  expect(drawnText('menu', null)).toEqual(['ASTEROIDS', 'GALORE', 'hold left', 'hold right', 'TAP TO START'])
})
