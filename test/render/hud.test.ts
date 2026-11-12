import { expect, test } from 'vitest'
import { createGame, layout } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { BoardRow, Game, GameState } from '../../src/game/types'
import { drawHud, shareButtonRect } from '../../src/render/hud'

const rows: BoardRow[] = [
  { rank: 1, callsign: 'COSMIC OTTER 42', value: 900, me: false },
  { rank: 2, callsign: 'LUNAR FOX 07', value: 640, me: true },
]

// Draws the HUD onto a context that only remembers the text it was asked to draw.
function drawnText(state: GameState, boards: { distance?: BoardRow[]; crew?: BoardRow[] }, extra: Partial<Game> = {}): string[] {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  Object.assign(g, { state, stateTime: 2 }, extra)
  Object.assign(g.boards, boards)
  const out: string[] = []
  const ctx = new Proxy({}, {
    get: (_t, prop) => (...args: unknown[]) => { if (prop === 'fillText') out.push(String(args[0])) },
    set: () => true,
  }) as CanvasRenderingContext2D
  drawHud(ctx, g)
  return out
}

test('HUD-01 game over shows the distance board', () => {
  const text = drawnText('over', { distance: rows, crew: [{ rank: 1, callsign: 'CREW ONLY 01', value: 9, me: false }] })
  expect(text).toContain('TOP DISTANCE')
  expect(text).toEqual(expect.arrayContaining(['1', 'COSMIC OTTER 42', '900 pc', '2', 'LUNAR FOX 07', '640 pc']))
  expect(text).not.toContain('CREW ONLY 01')
})

test('HUD-02 mission complete shows the crew board', () => {
  const text = drawnText('won', { distance: rows, crew: [{ rank: 1, callsign: 'CREW ONLY 01', value: 9, me: false }] })
  expect(text).toContain('TOP CREW')
  expect(text).toEqual(expect.arrayContaining(['CREW ONLY 01', '9']))
  expect(text).not.toContain('COSMIC OTTER 42')
})

test('HUD-03 no board, or an empty one: nothing about a board is drawn', () => {
  for (const boards of [{}, { distance: [], crew: [] }]) {
    for (const state of ['over', 'won'] as const) {
      expect(drawnText(state, boards).filter(t => t.startsWith('TOP '))).toEqual([])
    }
  }
})

test('HUD-04 the share button appears on end screens only when a link is ready', () => {
  for (const state of ['over', 'won'] as const) {
    expect(drawnText(state, {})).not.toContain('SHARE')
    expect(drawnText(state, {}, { shareReady: true })).toContain('SHARE')
    expect(drawnText(state, {}, { shareReady: true, shareNote: 1.5 })).toContain('COPIED')
  }
  expect(drawnText('menu', {}, { shareReady: true })).not.toContain('SHARE')
  expect(drawnText('play', {}, { shareReady: true })).not.toContain('SHARE')
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
  const won = drawnText('menu', {}, { shared: { callsign: 'COSMIC OTTER 42', outcome: 'won', distance: 2100, level: 4, rescued: 14 } })
  expect(won).toEqual(expect.arrayContaining(['COSMIC OTTER 42', '2100 pc', 'MISSION COMPLETE · 14 RESCUED', 'TAP TO START']))
  const lost = drawnText('menu', {}, { shared: { callsign: 'LUNAR FOX 07', outcome: 'over', distance: 564, level: 3, rescued: 2 } })
  expect(lost).toEqual(expect.arrayContaining(['LUNAR FOX 07', '564 pc', 'REACHED LEVEL 3']))
  expect(lost.join(' ')).not.toMatch(/RESCUED|SHIP/)   // a lost run does not give the twist away
})

test('HUD-07 with no shared run the start screen draws nothing extra', () => {
  expect(drawnText('menu', {})).toEqual(['ASTEROIDS', 'GALORE', 'hold left', 'hold right', 'TAP TO START'])
})
