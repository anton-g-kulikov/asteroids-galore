import { reachOf } from './game'
import { rand } from './random'
import { levelHandling } from './tuning'
import type { Asteroid, Game } from './types'

export function makeAsteroid(g: Game, x: number, r: number, o?: Partial<Asteroid> | null): Asteroid {
  const { U } = g
  const n = Math.floor(rand(8, 13))
  const shape: number[] = []
  for (let i = 0; i < n; i++) shape.push(rand(0.72, 1.08))
  const craters = []
  for (let i = 0, c = r > 32 * U ? 3 : Math.floor(rand(1, 3)); i < c; i++) {
    craters.push({ a: rand(0, 6.283), d: rand(0.15, 0.55), r: rand(0.12, 0.24) })
  }
  return Object.assign({
    x, y: -r - 4, r, shape, craters,
    vx: rand(-26, 26) * U,
    vy: rand(0.8, 1.3),
    rot: rand(0, 6.283), spin: rand(-1.4, 1.4),
    shade: Math.floor(rand(0, 3)),
    gy: 0,
    people: 0,
  }, o)
}

export function spawnAsteroid(g: Game): void {
  const big = Math.random() < 0.18
  const r = (big ? rand(34, 50) : rand(14, 30)) * g.U
  g.asteroids.push(makeAsteroid(g, rand(r * 0.4, g.W - r * 0.4), r, big ? { vy: rand(0.7, 1.1) } : null))
}

// Stranded crew are found on planetoids, never on plain rocks. Planetoids fall
// straight and steady so the approach is readable; so do the rocks escorting one.
const STEADY = () => ({ vx: 0, vy: 0.9, spin: rand(-0.5, 0.5) })
const RESCUE = () => ({ ...STEADY(), planet: true })

// Mostly one person per planetoid, sometimes two; three is a rarity.
const crewSize = () => { const p = Math.random(); return p < 0.6 ? 1 : p < 0.92 ? 2 : 3 }

export function spawnRescue(g: Game): void {
  const r = rand(22, 28) * g.U
  g.asteroids.push(makeAsteroid(g, rand(g.W * 0.15, g.W * 0.85), r,
    Object.assign(RESCUE(), { people: g.level === 1 ? 1 : crewSize() })))   // level 1: always a single crew
}

// Two crews on screen at once, in different columns, one following just
// above the other: 1 person on an open planetoid, or 2 on a planetoid flanked
// by escort rocks. Nothing forbids taking both, but the gap between them is sized
// from the ship's current top speed so that the dash across falls just short.
export function spawnDilemma(g: Game): void {
  const { W, H, U, ship, speed } = g
  const side = Math.random() < 0.5 ? -1 : 1          // which side the 2-crew planetoid is on
  const fast = { vy: 1.25 }
  const easy = makeAsteroid(g, W / 2 - side * W * 0.36, 24 * U, Object.assign(RESCUE(), fast, { people: 1 }))
  const hard = makeAsteroid(g, W / 2 + side * (W / 2 - 100 * U), 26 * U, Object.assign(RESCUE(), fast, { people: 2 }))
  const escortR = 14 * U, escortDist = hard.r + 52 * U
  const escortHit = escortR * 0.86 + ship.r * 0.7

  const [first, second] = Math.random() < 0.5 ? [easy, hard] : [hard, easy]
  const fall = fast.vy * H * 0.34 * speed                              // px/s
  const top = W * (1.25 + speed * 0.18) * levelHandling(g.level)       // ship px/s
  const reach = reachOf(g, first)
  // Best case for the player: grab the first crew early from its near edge,
  // then sprint to the other rock's corridor before its row arrives.
  const dash = (Math.abs(hard.x - easy.x) - reach * 0.5 - (escortDist - escortHit)) / top + 0.11
  const gap = Math.max(40 * U, Math.min(240 * U, 0.78 * fall * dash - reach * 0.866 + escortHit))

  first.y = -90 * U
  second.y = first.y - gap
  g.asteroids.push(easy, hard)
  for (const d of [-1, 1]) {
    g.asteroids.push(makeAsteroid(g, hard.x + d * escortDist, escortR, Object.assign(STEADY(), fast, { y: hard.y })))
  }
  g.slowWatch = first                           // time slows as the first crew comes into view
  g.spawnTimer = Math.max(g.spawnTimer, 0.9)    // brief lull so the choice is readable
}
