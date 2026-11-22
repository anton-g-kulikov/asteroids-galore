import { newSeed } from './random'
import type { Records } from './records'
import { CHOICES, CREW_MASS, FIELD_H, FIELD_W, LAST_LEVEL, SHIELDS, SHIPS, WELL_AHEAD, shipRadius, shipSeats } from './tuning'
import type { Asteroid, Game, GameState, Well } from './types'

export function createGame(records: Records): Game {
  const g: Game = {
    W: FIELD_W, H: FIELD_H, U: 1,
    state: 'menu', stateTime: 0, clock: 0, seed: newSeed(),
    time: 0, speed: 1, distance: 0, spawnTimer: 0, shake: 0, flash: 0,
    level: 1, shipType: 1, pick: 1, levelTime: 0, levelScore: 0, onboard: 0, fullFor: 0, events: [],
    saved: 0, lost: 0, missed: 0, rescueTimer: 0, rescueCount: 0,
    results: [], levelFrom: { distance: 0, missed: 0 },
    wormhole: null, wormTimer: 0, wormWaits: [], wormCount: 0, drops: [], dropCount: 0,
    wells: [{ x: 0, y: 0, dwell: 0, depth: 0 }], gridOff: 0,   // placed properly when a run starts
    shields: SHIELDS, grace: 0, slowmo: 0, slowWatch: null,
    newBest: false, records,
    board: null, boardOpen: false, story: null,
    shareReady: false, shareNote: 0, shared: null,
    ship: { x: FIELD_W / 2, y: 0, vx: 0, r: shipRadius(1) },
    asteroids: [], particles: [], floaters: [], castaways: [], stars: [],
  }
  g.ship.y = shipHome(g)
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

/** Where the ship flies, near the foot of the field. */
export const shipHome = (g: Pick<Game, 'H' | 'U'>): number => g.H - Math.max(110 * g.U, g.H * 0.16)

export function setState(g: Game, s: GameState): void { g.state = s; g.stateTime = 0 }

// The centre of a well sits just ahead of the ship's nose, so rocks that fall
// into it come together in front of the ship and then sweep down through it.
export const wellY = (g: Game): number => g.ship.y - g.ship.r * WELL_AHEAD
export const newWell = (g: Game, x: number): Well => ({ x, y: wellY(g), dwell: 0, depth: 0 })

/** Depth of the deepest well, 0..1. */
export const curvature = (g: Game): number => Math.max(...g.wells.map(w => w.depth))

/** Seats of the ship in use. */
export const seats = (g: Game): number => shipSeats(g.shipType)

/**
 * The ships on offer on the results screen between missions, smallest first.
 * After missions 2 and 4 (CHOICES): the ship in use and the next one up. After
 * mission 6: the fleet, every ship flown in this run, and nothing new. Fewer
 * than two means there is nothing to choose and any tap moves on.
 */
export function offer(g: Game): number[] {
  if (g.state !== 'between') return []
  if (isFleet(g)) return [...new Set(g.results.map(r => r.ship))].sort((a, b) => a - b)
  if (CHOICES.includes(g.level) && g.shipType < SHIPS) return [g.shipType, g.shipType + 1]
  return []
}

/** True on the stop before the last mission, where the whole fleet is offered. */
export const isFleet = (g: Game): boolean => g.state === 'between' && g.level === LAST_LEVEL - 1

/** A fuller ship is heavier, and digs a deeper well when it stays in one spot. */
export const shipMass = (g: Game): number => 1 + g.onboard * CREW_MASS

// Pickup range: a ring around the rock that widens a little as things speed up.
export const ringRadius = (g: Game, a: Asteroid): number => a.r + (30 + 8 * g.speed) * g.U
export const reachOf = (g: Game, a: Asteroid): number => ringRadius(g, a) + g.ship.r * 0.5
