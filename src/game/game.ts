import { newSeed } from './random'
import type { Records } from './records'
import { CREW_MASS, FIELD_H, FIELD_W, SHIELDS, WELL_AHEAD, shipRadius } from './tuning'
import type { Asteroid, Game, GameState, Well } from './types'

export function createGame(records: Records): Game {
  const g: Game = {
    W: FIELD_W, H: FIELD_H, U: 1,
    state: 'menu', stateTime: 0, clock: 0, seed: newSeed(),
    time: 0, speed: 1, distance: 0, spawnTimer: 0, shake: 0, flash: 0,
    level: 1, levelTime: 0, levelScore: 0, onboard: 0,
    saved: 0, lost: 0, missed: 0, rescueTimer: 0, rescueCount: 0,
    results: [], levelFrom: { distance: 0, missed: 0 },
    wormhole: null, wormTimer: 0, wormWaits: [], wormCount: 0, drops: [], dropCount: 0,
    wells: [{ x: 0, y: 0, dwell: 0, depth: 0 }], gridOff: 0,   // placed properly when a run starts
    shields: SHIELDS, grace: 0, slowmo: 0, slowWatch: null,
    newBest: false, records,
    board: null, boardOpen: false,
    shareReady: false, shareNote: 0, shared: null,
    ship: { x: FIELD_W / 2, y: 0, vx: 0, r: shipRadius(0) },
    asteroids: [], particles: [], floaters: [], stars: [],
  }
  g.ship.y = g.H - Math.max(110 * g.U, g.H * 0.16)
  for (let i = 0; i < 90; i++) g.stars.push({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8 })   // scenery: not dealt from the seed
  return g
}

/**
 * How the fixed play field sits in a window: scaled to fit whole, and centred.
 * The game itself never sees the window, so it plays the same in all of them.
 */
export function fit(innerWidth: number, innerHeight: number): { scale: number; x: number; y: number } {
  const scale = Math.min(innerWidth / FIELD_W, innerHeight / FIELD_H)
  return { scale, x: (innerWidth - FIELD_W * scale) / 2, y: (innerHeight - FIELD_H * scale) / 2 }
}

export function setState(g: Game, s: GameState): void { g.state = s; g.stateTime = 0 }

// The centre of a well sits just ahead of the ship's nose, so rocks that fall
// into it come together in front of the ship and then sweep down through it.
export const wellY = (g: Game): number => g.ship.y - g.ship.r * WELL_AHEAD
export const newWell = (g: Game, x: number): Well => ({ x, y: wellY(g), dwell: 0, depth: 0 })

/** Depth of the deepest well, 0..1. */
export const curvature = (g: Game): number => Math.max(...g.wells.map(w => w.depth))

/** A fuller ship is heavier, and digs a deeper well when it stays in one spot. */
export const shipMass = (g: Game): number => 1 + g.onboard * CREW_MASS

// Pickup range: a ring around the rock that widens a little as things speed up.
export const ringRadius = (g: Game, a: Asteroid): number => a.r + (30 + 8 * g.speed) * g.U
export const reachOf = (g: Game, a: Asteroid): number => ringRadius(g, a) + g.ship.r * 0.5
