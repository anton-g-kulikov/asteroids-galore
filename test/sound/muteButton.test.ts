import { expect, test } from 'vitest'
import { drawMuteButton, muteButtonRect, onMuteButton, showsMute } from '../../src/audio/muteButton'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { GameState } from '../../src/game/types'
import { shareButtonRect } from '../../src/render/hud'

const game = (state: GameState) => Object.assign(createGame(createRecords(null)), { state })

test('MUTE-01 a small icon in the top right of the start screen and between missions, only with Web Audio', () => {
  for (const state of ['menu', 'between'] as const) {
    const g = game(state)
    const r = muteButtonRect(g)
    expect(r.x).toBeGreaterThan(g.W * 0.7)
    expect(r.x + r.w).toBeLessThanOrEqual(g.W)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.y + r.h).toBeLessThan(g.H * 0.17 - 30)          // above the title of either screen
    expect(Math.min(r.w, r.h)).toBeGreaterThanOrEqual(40)     // a thumb fits
    expect(showsMute(g, true)).toBe(true)
    expect(showsMute(g, false)).toBe(false)
  }
  for (const s of ['play', 'launch'] as const) expect(showsMute(game(s), true)).toBe(false)
})

test('MUTE-04 on the end screens the icon sits in the bottom right corner, clear of the share button, and not over the leaderboard', () => {
  for (const state of ['over', 'won'] as const) {
    const g = game(state)
    const r = muteButtonRect(g), share = shareButtonRect(g)
    expect(showsMute(g, true)).toBe(true)
    expect(showsMute(g, false)).toBe(false)
    expect(r.x + r.w).toBeLessThanOrEqual(g.W)
    expect(r.y + r.h).toBeLessThanOrEqual(g.H)
    expect(r.y).toBeGreaterThan(g.H * 0.85)
    expect(r.y).toBeGreaterThan(share.y + share.h)
    g.boardOpen = true
    expect(showsMute(g, true)).toBe(false)
  }
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

test('MUTE-03 a tap on the icon is only a mute; anywhere else it is not taken', () => {
  for (const state of ['menu', 'between'] as const) {
    const g = game(state), r = muteButtonRect(g)
    expect(onMuteButton(g, r.x + r.w / 2, r.y + r.h / 2, true)).toBe(true)
    expect(onMuteButton(g, r.x + 2, r.y + r.h - 2, true)).toBe(true)
    expect(onMuteButton(g, r.x - 10, r.y + r.h / 2, true)).toBe(false)   // just beside it
    expect(onMuteButton(g, g.W / 2, g.H / 2, true)).toBe(false)
    expect(onMuteButton(g, r.x + r.w / 2, r.y + r.h / 2, false)).toBe(false)   // no Web Audio: no icon to tap
  }
  for (const state of ['play', 'launch'] as const) {
    const g = game(state), r = muteButtonRect(g)
    expect(onMuteButton(g, r.x + r.w / 2, r.y + r.h / 2, true)).toBe(false)
  }
})
