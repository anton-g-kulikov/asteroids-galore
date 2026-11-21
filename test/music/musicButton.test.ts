import { expect, test } from 'vitest'
import { muteButtonRect } from '../../src/audio/muteButton'
import { drawMusicButton, musicButtonRect, onMusicButton, showsMusicButton } from '../../src/music/musicButton'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { GameState } from '../../src/game/types'

const game = (state: GameState) => Object.assign(createGame(createRecords(null)), { state })

test('MUS-09 a note icon just left of the speaker; a tap on it only toggles the music', () => {
  for (const state of ['menu', 'between'] as const) {
    const g = game(state), r = musicButtonRect(g), m = muteButtonRect(g)
    expect([r.y, r.w, r.h]).toEqual([m.y, m.w, m.h])
    expect(r.x + r.w).toBeLessThanOrEqual(m.x - 4)              // clear of the speaker
    expect(r.x).toBeGreaterThan(g.W / 2)
    expect(r.y + r.h).toBeLessThan(g.H * 0.17 - 30)             // above the title
    expect(showsMusicButton(g, true)).toBe(true)
    expect(showsMusicButton(g, false)).toBe(false)
    expect(onMusicButton(g, r.x + r.w / 2, r.y + r.h / 2, true)).toBe(true)
    expect(onMusicButton(g, m.x + m.w / 2, m.y + m.h / 2, true)).toBe(false)   // the speaker is not the note
  }
  for (const s of ['play', 'over', 'won'] as const) expect(showsMusicButton(game(s), true)).toBe(false)
  const draw = (on: boolean) => {
    const calls: string[] = []
    drawMusicButton(new Proxy({}, { get: (_t, p) => () => void calls.push(String(p)), set: () => true }) as CanvasRenderingContext2D, game('menu'), on)
    return calls
  }
  expect(draw(true)).not.toContain('fillText')
  expect(draw(true)).toContain('ellipse')                        // the note's head
  expect(draw(false).filter(c => c === 'lineTo').length).toBeGreaterThan(draw(true).filter(c => c === 'lineTo').length)   // and a slash when off
})
