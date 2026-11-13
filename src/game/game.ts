import { rand } from './random'
import type { Records } from './records'
import { SHIELDS, MAX_FIELD_WIDTH, WELL_AHEAD, shipRadius } from './tuning'
import type { Asteroid, Game, GameState, Well } from './types'

export function createGame(records: Records): Game {
  return {
    W: 0, H: 0, U: 1,
    state: 'menu', stateTime: 0, clock: 0,
    time: 0, speed: 1, score: 0, spawnTimer: 0, shake: 0, flash: 0,
    level: 1, levelTime: 0, levelScore: 0, onboard: 0,
    rescued: 0, missed: 0, rescueTimer: 0, rescueCount: 0,
    wormhole: null, wormTimer: 0,
    wells: [{ x: 0, y: 0, dwell: 0, depth: 0 }], gridOff: 0,   // placed properly when a run starts
    shields: SHIELDS, grace: 0, slowmo: 0, slowWatch: null,
    newBest: false, newBestCrew: false, records,
    boards: { distance: null, crew: null },
    shareReady: false, shareNote: 0, shared: null,
    ship: { x: 0, y: 0, vx: 0, r: 0 },
    asteroids: [], particles: [], floaters: [], stars: [],
  }
}

/** Fits the play field to a window of the given size. */
export function layout(g: Game, innerWidth: number, innerHeight: number): void {
  const oldW = g.W || 1
  g.W = Math.min(innerWidth, MAX_FIELD_WIDTH)
  g.H = innerHeight
  g.U = Math.min(g.W, g.H * 0.7) / 400
  g.ship.r = shipRadius(g.level, g.U)
  g.ship.x = g.state === 'play' ? g.ship.x * g.W / oldW : g.W / 2
  g.ship.y = g.H - Math.max(110 * g.U, g.H * 0.16)
  if (!g.stars.length) {
    for (let i = 0; i < 90; i++) g.stars.push({ x: Math.random(), y: Math.random(), z: rand(0.2, 1) })
  }
}

export function setState(g: Game, s: GameState): void { g.state = s; g.stateTime = 0 }

// The centre of a well sits just ahead of the ship's nose, so rocks that fall
// into it come together in front of the ship and then sweep down through it.
export const wellY = (g: Game): number => g.ship.y - g.ship.r * WELL_AHEAD
export const newWell = (g: Game, x: number): Well => ({ x, y: wellY(g), dwell: 0, depth: 0 })

/** Depth of the deepest well, 0..1. */
export const curvature = (g: Game): number => Math.max(...g.wells.map(w => w.depth))

/** A bigger, fuller ship is heavier. */
export const shipMass = (g: Game): number => shipRadius(g.level, g.U) / (13 * g.U) + g.onboard * 0.02

// Pickup range: a ring around the rock that widens a little as things speed up.
export const ringRadius = (g: Game, a: Asteroid): number => a.r + (30 + 8 * g.speed) * g.U
export const reachOf = (g: Game, a: Asteroid): number => ringRadius(g, a) + g.ship.r * 0.5
