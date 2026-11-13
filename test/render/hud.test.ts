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

test('HUD-02 an end screen is a table with a row per mission and a total, then the score and its sum', () => {
  const won = drawnText('won', null, {
    distance: 2140.6, saved: 12, lost: 0, missed: 7,
    results: [{ level: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, saved: 10, missed: 6, distance: 1779 }],
  })
  expect(won).toEqual(expect.arrayContaining([
    'ALL MISSIONS COMPLETE', '361 pc', '×2', '1779 pc', '×10',
    'TOTAL', '2140 pc', '×12', 'SCORE', '25,680', 'NOT SAVED', '7 MISSED',
  ]))
  expect(won.join(' ')).not.toMatch(/WENT DOWN|LOST/)
  // distance first, crew saved last as the multiplier
  expect(won.filter(t => ['MISSION', 'DISTANCE', 'MISSED', 'SAVED'].includes(t))).toEqual(['MISSION', 'DISTANCE', 'SAVED'])   // missed is not a column

  // a crash: the unfinished mission shows the crew it cost, and the total counts them off
  const over = drawnText('over', null, {
    distance: 1000, saved: 9, lost: 3, missed: 2,
    results: [{ level: 1, saved: 9, missed: 0, distance: 600 }, { level: 2, saved: 0, lost: 3, missed: 2, distance: 400 }],
  })
  expect(over).toEqual(expect.arrayContaining([
    'GAME OVER', '600 pc', '×9', '400 pc', '−3', 'TOTAL', '1000 pc', '×6', '6,000', 'NOT SAVED', '3 WENT DOWN WITH THE SHIP', '2 MISSED',
  ]))

  expect(over.join(' ')).not.toContain('LOST)')   // the sum line is gone: the TOTAL row is the sum

  // the best comes straight after the score, before the crew who were not saved
  const best = drawnText('over', null, { distance: 1000, saved: 9, lost: 3, missed: 2, newBest: true })
  expect(best.slice(best.indexOf('6,000'), best.indexOf('6,000') + 3)).toEqual(['6,000', 'NEW BEST!', 'NOT SAVED'])

  // nobody saved: the score is nothing, however far the ship flew
  expect(drawnText('over', null, { distance: 3000, saved: 0, lost: 0, missed: 4 })).toEqual(expect.arrayContaining(['3000 pc', '×0', '0', '4 MISSED']))
})

test('HUD-03 no board, or an empty one: no link and no board', () => {
  for (const board of [null, []]) {
    for (const state of ['over', 'won'] as const) {
      const text = drawnText(state, board)
      expect(text.filter(t => t.startsWith('TOP ') || t === 'LEADERBOARD')).toEqual([])
    }
  }
})

test('HUD-08 during a run the big number is the score, not the distance', () => {
  expect(drawnText('play', null, { distance: 400, saved: 0 })).not.toContain('0')   // nothing saved, nobody aboard: no number at all
  const text = drawnText('play', null, { distance: 400.9, saved: 3, missed: 1 })
  expect(text).toEqual(expect.arrayContaining(['1,200', 'SAVED 3', 'MISSED 1']))
  expect(text).not.toContain('400 pc')
})

test('HUD-09 one number at a time: what the crew on board are worth, or else the score', () => {
  // crew on board, nothing banked: the pending amount, and no "0"
  const waiting = drawnText('play', null, { distance: 350.4, saved: 0, onboard: 2 })
  expect(waiting).toContain('+700')
  expect(waiting).not.toContain('0')
  // crew on board and a score banked: still only the pending amount
  const carrying = drawnText('play', null, { distance: 1000, saved: 3, onboard: 4 })
  expect(carrying).toContain('+4,000')
  expect(carrying).not.toContain('3,000')
  // empty seats: the score
  const empty = drawnText('play', null, { distance: 1000, saved: 3, onboard: 0 })
  expect(empty).toContain('3,000')
  expect(empty.some(t => t.startsWith('+'))).toBe(false)
})

test('HUD-10 between levels: the mission and the run so far, each as distance × saved = score', () => {
  const text = drawnText('between', null, {
    level: 2, distance: 881.3, saved: 5,
    results: [{ level: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, saved: 3, missed: 0, distance: 520 }],
  })
  expect(text).toEqual([
    'MISSION 2 COMPLETE', 'DISTANCE', 'SAVED', 'SCORE',
    'MISSION', '520 pc', '×3', '1,560',     // the mission just finished: its own sum
    'TOTAL', '881 pc', '×5', '4,405',       // the run so far: the score that counts
    '0 MISSED', 'TAP TO CONTINUE',
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
