import { expect, test } from 'vitest'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import type { Game, GameState } from '../../src/game/types'
import { look, render, shipAlpha } from '../../src/render/render'

const game = (state: GameState, stateTime = 0): Game => Object.assign(createGame(createRecords(null)), { state, stateTime })

// Renders onto a context that remembers the strength each cockpit (known by the right side of its glass) was drawn at.
function cockpits(g: Game): number[] {
  let alpha = 1
  const seen: number[] = []
  const ctx = new Proxy({}, {
    get: (_t, p) => p === 'measureText' ? () => ({ width: 10 }) : (...args: unknown[]) => { if (p === 'quadraticCurveTo' && args[2] === g.ship.r * 0.191) seen.push(alpha) },
    set: (_t, p, v) => { if (p === 'globalAlpha') alpha = v as number; return true },
  }) as CanvasRenderingContext2D
  render(ctx, g)
  return seen
}

test('SHIPFADE-01 between missions the ship fades away, then is gone', () => {
  expect(look.shipFade).toBe(0.8)
  expect(shipAlpha(game('play'))).toBe(1)
  expect(shipAlpha(game('menu'))).toBe(1)
  expect(shipAlpha(game('between', 0))).toBe(1)
  expect(shipAlpha(game('between', 0.4))).toBeCloseTo(0.5)
  expect(shipAlpha(game('between', 0.8))).toBe(0)
  expect(shipAlpha(game('between', 3))).toBe(0)
  expect(cockpits(game('play'))).toEqual([1])
  expect(cockpits(game('between', 0.4))[0]).toBeCloseTo(0.5)
  expect(cockpits(game('between', 1))).toEqual([])                 // not drawn once it has faded
  // the shields (arcs ahead of the nose) fade with the hull
  const g = game('between', 0.4)
  let alpha = 1
  const shields: number[] = []
  const ctx = new Proxy({}, {
    get: (_t, p) => p === 'measureText' ? () => ({ width: 10 }) : (...args: unknown[]) => { if (p === 'arc' && args[2] === g.ship.r * 1.75) shields.push(alpha) },
    set: (_t, p, v) => { if (p === 'globalAlpha') alpha = v as number; return true },
  }) as CanvasRenderingContext2D
  render(ctx, g)
  expect(shields).toHaveLength(1)
  expect(shields[0]).toBeCloseTo(0.5)
})
