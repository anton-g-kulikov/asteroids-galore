import { expect, test } from 'vitest'
import { drawMuteButton, muteButtonRect, showsMute } from '../../src/audio/muteButton'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { GameState } from '../../src/game/types'

const game = (state: GameState) => Object.assign(createGame(createRecords(null)), { state })

test('MUTE-01 a small icon in the top right of the start screen only, and only with Web Audio', () => {
  const g = game('menu')
  const r = muteButtonRect(g)
  expect(r.x).toBeGreaterThan(g.W * 0.7)
  expect(r.x + r.w).toBeLessThanOrEqual(g.W)
  expect(r.y).toBeGreaterThanOrEqual(0)
  expect(r.y + r.h).toBeLessThan(g.H * 0.2)                 // well above the title
  expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(40)     // a thumb fits
  expect(showsMute(g, true)).toBe(true)
  expect(showsMute(g, false)).toBe(false)
  for (const s of ['play', 'between', 'over', 'won'] as const) expect(showsMute(game(s), true)).toBe(false)
})

test('MUTE-02 the icon shows waves when sound is on and a slash when muted, and no text', () => {
  const draw = (muted: boolean) => {
    const calls: string[] = []
    const ctx = new Proxy({}, { get: (_t, p) => () => void calls.push(String(p)), set: () => true }) as CanvasRenderingContext2D
    drawMuteButton(ctx, game('menu'), muted)
    return calls
  }
  const on = draw(false), off = draw(true)
  expect(on).not.toContain('fillText')
  expect(off).not.toContain('fillText')
  expect(on.filter(c => c === 'arc').length).toBeGreaterThanOrEqual(2)   // sound waves
  expect(off.filter(c => c === 'arc').length).toBe(0)
  expect(off.filter(c => c === 'lineTo').length).toBeGreaterThan(on.filter(c => c === 'lineTo').length)   // the slash
})
