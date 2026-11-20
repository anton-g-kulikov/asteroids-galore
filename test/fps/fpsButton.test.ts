import { expect, test } from 'vitest'
import { muteButtonRect } from '../../src/audio/muteButton'
import { FPS_COLOUR, drawFpsButton, drawFpsReading, fpsButtonRect, fpsReadingAt, onFpsButton, showsFpsButton } from '../../src/fps/fpsButton'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { GameState } from '../../src/game/types'

const game = (state: GameState) => Object.assign(createGame(createRecords(null)), { state })

function drawn(draw: (ctx: CanvasRenderingContext2D) => void) {
  const calls: string[] = [], text: string[] = []
  const ctx = new Proxy({}, {
    get: (_t, p) => (...a: unknown[]) => { calls.push(String(p)); if (p === 'fillText') text.push(String(a[0])) },
    set: () => true,
  }) as CanvasRenderingContext2D
  draw(ctx)
  return { calls, text }
}

test('FPS-03 a gauge icon in the top left of the start screen, mirroring the speaker; a tap on it only toggles', () => {
  const g = game('menu')
  const r = fpsButtonRect(g), mute = muteButtonRect(g)
  expect(r.x).toBeGreaterThanOrEqual(0)
  expect(r.x + r.w).toBeLessThan(g.W * 0.3)
  expect([r.y, r.w, r.h]).toEqual([mute.y, mute.w, mute.h])           // the same row and size as the speaker
  expect(r.x).toBeCloseTo(g.W - (mute.x + mute.w))                     // mirrored
  expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(40)
  expect(showsFpsButton(g)).toBe(true)
  for (const s of ['play', 'between', 'over', 'won'] as const) expect(showsFpsButton(game(s))).toBe(false)
  expect(onFpsButton(g, r.x + r.w / 2, r.y + r.h / 2)).toBe(true)
  expect(onFpsButton(g, g.W / 2, g.H / 2)).toBe(false)
  expect(onFpsButton(game('between'), r.x + r.w / 2, r.y + r.h / 2)).toBe(false)   // not shown there: not a button
  // a dial with a needle, and no word
  const { calls, text } = drawn(ctx => drawFpsButton(ctx, g, false))
  expect(text).toEqual([])
  expect(calls).toContain('arc')
  // switched on, it is brighter than off
  const alpha = (on: boolean) => { let a = 0; const ctx = new Proxy({}, { get: () => () => {}, set: (_t, p, v) => { if (p === 'globalAlpha') a = Math.max(a, Number(v)); return true } }) as CanvasRenderingContext2D; drawFpsButton(ctx, g, on); return a }
  expect(alpha(true)).toBeGreaterThan(alpha(false))
})

test('FPS-04 when on, the reading sits in the left corner above the progress bar on every screen; off, nothing', () => {
  for (const state of ['menu', 'play', 'between', 'over', 'won'] as const) {
    const g = game(state)
    const at = fpsReadingAt(g)
    expect(at.x).toBeLessThan(g.W * 0.2)
    expect(at.y).toBeLessThan(g.H - 16 * g.U)                  // above the progress bar
    expect(at.y).toBeGreaterThan(g.ship.y + 27 * 3.2)          // below the ship, whatever its size
    const { text } = drawn(ctx => drawFpsReading(ctx, g, { fps: 58, low: 41 }))
    expect(text).toEqual(['58 FPS · LOW 41'])
    let fill = ''
    drawFpsReading(new Proxy({}, { get: () => () => {}, set: (_t, p, v) => { if (p === 'fillStyle') fill = String(v); return true } }) as CanvasRenderingContext2D, g, { fps: 58, low: 41 })
    expect(fill).toBe(FPS_COLOUR)                               // the star colour, not the score's white
  }
  expect(drawn(ctx => drawFpsReading(ctx, game('play'), null)).text).toEqual([])
})
