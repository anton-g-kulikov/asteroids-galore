import { expect, test } from 'vitest'
import { version } from '../../package.json'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { BoardRow, Game, GameState } from '../../src/game/types'
import { shipRadius } from '../../src/game/tuning'
import { boardButtonRect, drawHud, endNote, shareButtonRect, shipCardScale, shipCards } from '../../src/render/hud'

const rows: BoardRow[] = [
  { rank: 1, callsign: 'COSMIC OTTER 42', value: 25680, me: false, end: { outcome: 'won', level: 7, finalDistance: 5400, ship: 4 } },
  { rank: 2, callsign: 'LUNAR FOX 07', value: 640, me: true, end: { outcome: 'over', level: 3, finalDistance: 0, ship: 2 } },
]

// Draws the HUD onto a context that only remembers the text it was asked to draw.
function drawnText(state: GameState, board: BoardRow[] | null, extra: Partial<Game> = {}): string[] {
  const g = createGame(createRecords(null))
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

test('HUD-11 the leaderboard screen: every row by score with how the run ended, and a way back, in place of the end screen', () => {
  for (const state of ['over', 'won'] as const) {
    const text = drawnText(state, rows, { boardOpen: true })
    expect(text).toEqual([
      'TOP SCORES', '1', 'COSMIC OTTER 42', '25,680', 'FINISHED 7/7 · HOME · 5,400 pc · 12 SEATS', '2', 'LUNAR FOX 07', '640', 'FINISHED 2/7', 'TAP TO GO BACK',
    ])
  }
  expect(endNote({ outcome: 'over', level: 7, finalDistance: 7100, ship: 1 })).toBe('FINISHED 6/7 · LOST · 7,100 pc · 4 SEATS')
  expect(endNote({ outcome: 'over', level: 7, finalDistance: 7100, ship: 0 })).toBe('FINISHED 6/7 · LOST · 7,100 pc')   // an entry from before ships were recorded
  expect(endNote({ outcome: 'over', level: 1, finalDistance: 0, ship: 1 })).toBe('FINISHED 0/7')
  // an entry that does not say how its run ended: the row without a note
  expect(drawnText('over', [{ ...rows[0], end: null }], { boardOpen: true })).toEqual(['TOP SCORES', '1', 'COSMIC OTTER 42', '25,680', 'TAP TO GO BACK'])
  // no board to show: the end screen stays, even if the flag is somehow set
  expect(drawnText('over', null, { boardOpen: true })).toContain('GAME OVER')
})

test('HUD-12 the leaderboard link sits top left, clear of the share button', () => {
  const g = createGame(createRecords(null))
  const b = boardButtonRect(g), sh = shareButtonRect(g)
  expect(b.x).toBeGreaterThanOrEqual(0)
  expect(b.x + b.w).toBeLessThan(sh.x)
  expect(b.y + b.h).toBeLessThan(g.H * 0.2)
  expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(40)   // comfortable to tap
})

test('HUD-02 an end screen is a table with a sum per mission, then the score they add up to', () => {
  const won = drawnText('won', null, {
    distance: 2140.6, saved: 12, lost: 0, missed: 7,
    results: [{ level: 1, ship: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, ship: 3, saved: 10, missed: 6, distance: 1779 }],
  })
  // each row: mission, distance, crew saved as a multiplier, what the missed cost, its score
  expect(won.slice(0, 16)).toEqual([
    'MADE IT HOME', 'MISSION', 'DISTANCE', 'SAVED', 'MISSED', 'SCORE',
    '1', '361 pc', '×2', '1 (−5%)', '686',
    '2', '1779 pc', '×10', '6 (−30%)', '12,453',
  ])
  expect(won).toEqual(expect.arrayContaining(['SCORE', '13,139', 'NOT SAVED', '7 MISSED']))
  expect(won.join(' ')).not.toMatch(/WENT DOWN|LOST|TOTAL/)

  // a crash: the unfinished mission shows the crew who went down, its missed without a percentage, and no score
  const over = drawnText('over', null, {
    distance: 1000, saved: 9, lost: 3, missed: 2,
    results: [{ level: 1, ship: 1, saved: 9, missed: 0, distance: 600 }, { level: 2, ship: 1, saved: 0, lost: 3, missed: 2, distance: 400 }],
  })
  expect(over.slice(6, 16)).toEqual(['1', '600 pc', '×9', '—', '5,400', '2', '400 pc', '−3', '2', '—'])
  expect(over.join(' ')).not.toMatch(/−1,200|4,200/)   // nothing is taken off what was banked
  expect(over).toEqual(expect.arrayContaining(['GAME OVER', '5,400', 'NOT SAVED', '3 WENT DOWN WITH THE SHIP', '2 MISSED']))

  // the best comes straight after the score, before the crew who were not saved
  const best = drawnText('over', null, { results: [{ level: 1, ship: 1, saved: 3, missed: 0, distance: 2000 }], newBest: true })
  expect(best.slice(best.lastIndexOf('6,000'), best.lastIndexOf('6,000') + 3)).toEqual(['6,000', 'NEW BEST!', 'NOT SAVED'])

  // nobody saved: the score is nothing, however far the ship flew
  const none = drawnText('over', null, { distance: 3000, missed: 4, results: [{ level: 1, ship: 1, saved: 0, lost: 0, missed: 4, distance: 3000 }] })
  expect(none).toEqual(expect.arrayContaining(['3000 pc', '×0', '4', '—', '0', '4 MISSED']))

  // seven missions fit above the prompt on the fixed field
  const seven = drawnText('won', null, { results: [1, 2, 3, 4, 5, 6, 7].map(level => ({ level, ship: 1, saved: 2, missed: 0, distance: 500 })) })
  expect(seven.slice(6, 41).filter((_, i) => i % 5 === 0)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
  expect(seven).toContain('7,000')

  // a missed crew member costs 5% in every ship, whatever the mission
  const late = drawnText('won', null, { results: [3, 4, 5].map(ship => ({ level: 7, ship, saved: 10, missed: 3, distance: 1000 })) })
  expect(late.filter(t => t.startsWith('3 ('))).toEqual(['3 (−15%)', '3 (−15%)', '3 (−15%)'])
  expect(late.filter(t => t === '8,500')).toHaveLength(3)
})

test('HUD-03 no board, or an empty one: no link and no board', () => {
  for (const board of [null, []]) {
    for (const state of ['over', 'won'] as const) {
      const text = drawnText(state, board)
      expect(text.filter(t => t.startsWith('TOP ') || t === 'LEADERBOARD')).toEqual([])
    }
  }
})

const banked = [{ level: 1, ship: 1, saved: 3, missed: 0, distance: 400 }]

test('HUD-13 the mission counter is out of 7, and spare shields add to the row', () => {
  expect(drawnText('play', null, { level: 5 })).toContain('MISSION 5/7')
  const arcs = (shields: number) => {
    const g = createGame(createRecords(null))
    Object.assign(g, { state: 'play', shields })
    let n = 0
    const ctx = new Proxy({}, { get: (_t, prop) => (...args: unknown[]) => { if (prop === 'arc' && args[2] === 7) n++ }, set: () => true }) as CanvasRenderingContext2D
    drawHud(ctx, g)
    return n
  }
  expect([0, 2, 3, 5].map(arcs)).toEqual([3, 3, 3, 5])
})

test('HUD-14 the crew count is yellow while seats are free and green when the ship is full, and swells as it fills', () => {
  const crew = (onboard: number, fullFor = 9) => {
    const g = createGame(createRecords(null))
    Object.assign(g, { state: 'play', shipType: 2, onboard, fullFor })
    let font = '', fill = '', seen = { font: '', fill: '', str: '' }
    const ctx = new Proxy({}, {
      get: (_t, prop) => (...args: unknown[]) => { if (prop === 'fillText' && String(args[0]).startsWith('CREW')) seen = { font, fill, str: String(args[0]) } },
      set: (_t, prop, value) => { if (prop === 'font') font = String(value); if (prop === 'fillStyle') fill = String(value); return true },
    }) as CanvasRenderingContext2D
    drawHud(ctx, g)
    return { ...seen, size: parseInt(seen.font.split(' ')[1]) }
  }
  expect([crew(0).str, crew(0).fill]).toEqual(['CREW 0/6', '#ffd166'])
  expect(crew(5).fill).toBe('#ffd166')
  expect([crew(6).str, crew(6).fill]).toEqual(['CREW 6/6', '#5dffa0'])
  expect(crew(6, 0).size).toBeGreaterThan(crew(6).size)     // just filled: drawn larger for a moment
  expect(crew(6, 2).size).toBe(crew(5).size)                // and back to its size
})

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
  // a crew left behind on this mission takes 5% off what those on board are worth
  expect(drawnText('play', null, { distance: 1400, onboard: 4, missed: 1, results: banked, levelFrom: from })).toContain('+3,800')
  // and the same in the biggest ship
  expect(drawnText('play', null, { shipType: 5, distance: 1400, onboard: 4, missed: 1, results: banked, levelFrom: from })).toContain('+3,800')
  // empty seats: the score
  const empty = drawnText('play', null, { distance: 1400, saved: 3, onboard: 0, results: banked, levelFrom: from })
  expect(empty).toContain('1,200')
  expect(empty.some(t => t.startsWith('+'))).toBe(false)
})

test('HUD-10 between levels: every mission so far as a sum, and the run\'s score so far', () => {
  const text = drawnText('between', null, {
    level: 2, distance: 881.3, saved: 5,
    results: [{ level: 1, ship: 1, saved: 2, missed: 1, distance: 361 }, { level: 2, ship: 1, saved: 3, missed: 0, distance: 520 }],
  })
  expect(text).toEqual([
    'MISSION 2 COMPLETE', 'MISSION', 'DISTANCE', 'SAVED', 'MISSED', 'SCORE',
    '1', '361 pc', '×2', '1 (−5%)', '686',     // the same table as the end screen: every mission flown
    '2', '520 pc', '×3', '—', '1,560',         // the one just finished comes last
    'TOTAL', '2,246',                          // the run so far: 686 + 1,560
  ])                                           // two ships are on offer: no prompt and no caption beside them
  // after mission 1 nothing is on offer: the prompt
  expect(drawnText('between', null, { level: 1, results: [{ level: 1, ship: 1, saved: 2, missed: 0, distance: 500 }] }).slice(-1)).toEqual(['TAP TO CONTINUE'])
  // after the first mission there is one row; after the sixth, six
  expect(drawnText('between', null, { level: 1, results: [{ level: 1, ship: 1, saved: 2, missed: 0, distance: 500 }] })).toHaveLength(14)
  const six = drawnText('between', null, { level: 6, results: [1, 2, 3, 4, 5, 6].map(level => ({ level, ship: 1, saved: 2, missed: 0, distance: 500 })) })
  expect(six.slice(6, 36).filter((_, i) => i % 5 === 0)).toEqual(['1', '2', '3', '4', '5', '6'])
  expect(six.slice(-3)).toEqual(['TOTAL', '6,000', 'TAP TO CONTINUE'])
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
  const r = shareButtonRect(g)
  expect(r.x).toBeGreaterThan(g.W / 2)
  expect(r.x + r.w).toBeLessThanOrEqual(g.W)
  expect(r.y).toBeGreaterThanOrEqual(0)
  expect(r.y + r.h).toBeLessThan(g.H * 0.2)
  expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(40)   // comfortable to tap
})

test('HUD-06 the start screen shows a shared run', () => {
  const won = drawnText('menu', null, { shared: { callsign: 'COSMIC OTTER 42', outcome: 'won', score: 29400, saved: 14, distance: 2100 } })
  expect(won).toEqual(expect.arrayContaining(['COSMIC OTTER 42', '29,400', 'MADE IT HOME · 14 SAVED', 'TAP TO START']))
  const lost = drawnText('menu', null, { shared: { callsign: 'LUNAR FOX 07', outcome: 'over', score: 1128, saved: 2, distance: 564 } })
  expect(lost).toEqual(expect.arrayContaining(['LUNAR FOX 07', '1,128', '2 SAVED · 564 pc']))
})

test('HUD-07 the start screen: title, controls, and at the foot the version and the seed of the next run', () => {
  expect(drawnText('menu', null, { seed: 0x4f2a9c })).toEqual(['ASTEROIDS', 'GALORE', 'hold left', 'hold right', `v${version} · SEED 4F2A9C`, 'TAP TO START'])
  expect(drawnText('menu', null, { seed: 0x2a })).toContain(`v${version} · SEED 00002A`)
  for (const state of ['play', 'between', 'over', 'won'] as const) expect(drawnText(state, null).join(' ')).not.toContain('SEED')
})

// The stop after `level`, with every mission before it flown in `ships`.
function between(ships: number[], extra: Partial<Game> = {}): Game {
  const g = createGame(createRecords(null))
  Object.assign(g, {
    state: 'between', stateTime: 2, level: ships.length, shipType: ships[ships.length - 1], pick: ships[ships.length - 1],
    results: ships.map((ship, i) => ({ level: i + 1, ship, saved: 2, missed: 0, distance: 500 })),
  }, extra)
  return g
}

// Counts the seat dots and frames drawn, and where the frames are.
function drawnCards(g: Game) {
  let fill = '', width = 0
  const seen = { seats: 0, frames: [] as number[], widths: [] as number[], text: [] as string[] }
  let pending: number[] | null = null
  const ctx = new Proxy({}, {
    get: (_t, prop) => (...args: unknown[]) => {
      if (prop === 'fillText') seen.text.push(String(args[0]))
      if (prop === 'roundRect' && Number(args[3]) > 100) pending = args as number[]
      if (prop === 'stroke' && pending) { seen.frames.push(pending[0]); seen.widths.push(width); pending = null }
      if (prop === 'beginPath') pending = null
      if (prop === 'fill' && fill === '#aab4cc') seen.seats++
    },
    set: (_t, prop, value) => { if (prop === 'fillStyle') fill = String(value); if (prop === 'lineWidth') width = Number(value); return true },
  }) as CanvasRenderingContext2D
  drawHud(ctx, g)
  return seen
}

test('HUD-15 between missions the ships on offer stand side by side under the table, with no caption and no prompt', () => {
  // after mission 3 in ship 2: the ship in use on the left, the next one up on the right
  const g = between([1, 1, 2])
  const cards = shipCards(g)
  expect(cards.map(c => c.ship)).toEqual([2, 3])
  expect(cards[0].x + cards[0].w).toBeLessThan(g.W / 2)       // each inside its own half: what is tapped is what is seen
  expect(cards[1].x).toBeGreaterThan(g.W / 2)
  const seen = drawnCards(g)
  expect(seen.frames).toEqual(cards.map(c => c.x))
  expect(seen.seats).toBe(6 + 8)                              // the hulls show their seats: that is the whole message
  expect(seen.text.slice(-2)).toEqual(['TOTAL', '3,000'])     // nothing written under the table
  expect(seen.text.join(' ')).not.toMatch(/TAP|SEATS|KEEP|UPGRADE/)
  // the biggest hull on offer stands inside its frame, nose to tail, at every stop and in the fleet
  for (const flown of [[1, 1], [1, 1, 2], [1, 1, 2, 3], [1, 1, 2, 3, 4], [1, 1, 2, 3, 4, 5]]) {
    const stop = between(flown), offered = shipCards(stop)
    const r = shipRadius(offered[offered.length - 1].ship) * shipCardScale(stop, offered)
    expect(2.3 * r).toBeLessThanOrEqual(offered[0].h - 14 - 8)   // 14 under the tail, and clear of the frame above the nose
    expect(2 * r).toBeLessThanOrEqual(offered[0].w - 8)
  }
  // after mission 1 there is no offer: no cards, and the prompt
  expect(shipCards(between([1]))).toEqual([])
  expect(drawnCards(between([1])).text.slice(-1)).toEqual(['TAP TO CONTINUE'])
})

test('HUD-16 the fleet before mission 7 is a row of the ships flown, with the one in use marked; it fits a short phone', () => {
  const g = between([1, 1, 2, 3, 4, 5])
  const cards = shipCards(g)
  expect(cards.map(c => c.ship)).toEqual([1, 2, 3, 4, 5])
  cards.forEach((c, i) => {
    expect(c.x).toBeGreaterThanOrEqual(i * g.W / 5)           // each inside its own fifth
    expect(c.x + c.w).toBeLessThanOrEqual((i + 1) * g.W / 5)
    expect(c.w).toBeGreaterThanOrEqual(44)                    // wide enough for a thumb
  })
  // six rows, the total and the cards all sit above the ship waiting at the foot of the field, shields included
  expect(cards[0].y + cards[0].h).toBeLessThan(g.ship.y - 27 * 3.2)
  const seen = drawnCards(g)
  expect(seen.seats).toBe(4 + 6 + 8 + 12 + 18)
  expect(seen.widths.indexOf(Math.max(...seen.widths))).toBe(4)   // ship 5 is in use: its frame is the heavy one
  expect(drawnCards(between([1, 1, 2, 3, 4, 5], { pick: 2 })).widths.indexOf(Math.max(...seen.widths))).toBe(1)
  // a run that never upgraded has one ship: nothing to choose, the prompt as after mission 1
  expect(shipCards(between([1, 1, 1, 1, 1, 1]))).toEqual([])
  expect(drawnCards(between([1, 1, 1, 1, 1, 1])).text.slice(-1)).toEqual(['TAP TO CONTINUE'])
})
