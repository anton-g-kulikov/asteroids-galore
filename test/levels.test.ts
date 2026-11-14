import { expect, test } from 'vitest'
import { createGame, fit, shipMass } from '../src/game/game'
import { seedRandom } from '../src/game/random'
import { createRecords } from '../src/game/records'
import { startGame, tryStart, update } from '../src/game/simulation'
import { WORM_WAITS, levelTarget } from '../src/game/tuning'
import type { Game } from '../src/game/types'

function playing(level = 1): Game {
  const g = createGame(createRecords(null))
  startGame(g)
  g.level = level
  g.spawnTimer = 999; g.rescueTimer = 999   // an empty sky
  return g
}

const step = (g: Game, steer = 0) => update(g, 1 / 60, steer)

// Puts a wormhole on the ship and runs one frame, so the ship flies into it.
function intoWormhole(g: Game) {
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  step(g)
}

const rock = (g: Game) => ({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0 })

test('LEVEL-01 a wormhole ends the level on a results screen and writes down what the level added', () => {
  const g = playing()
  Object.assign(g, { distance: 361.7, onboard: 2, missed: 1, shields: 1 })
  intoWormhole(g)
  expect(g.state).toBe('between')
  expect(g.level).toBe(1)               // the next level has not started
  expect([g.saved, g.onboard]).toEqual([2, 0])
  expect(g.results).toEqual([{ level: 1, saved: 2, missed: 1, distance: 361 }])
})

test('LEVEL-02 the results screen waits for a tap, and ignores one that comes at once', () => {
  const g = playing()
  intoWormhole(g)
  tryStart(g)
  expect(g.state).toBe('between')
  update(g, 0.8, 0)
  expect(g.state).toBe('between')       // it never moves on by itself
  expect(Math.floor(g.distance)).toBe(0) // and nothing is flown while it is up
  tryStart(g)
  expect([g.state, g.level, g.shields]).toEqual(['play', 2, 3])
})

test('LEVEL-03 each level gets its own row, counted from where the level began', () => {
  const g = playing()
  Object.assign(g, { distance: 400, onboard: 1, missed: 2 })
  intoWormhole(g)
  update(g, 0.8, 0); tryStart(g)
  g.spawnTimer = 999; g.rescueTimer = 999
  Object.assign(g, { distance: g.distance + 520.5, onboard: 3, missed: 5 })
  intoWormhole(g)
  expect(g.results[1]).toEqual({ level: 2, saved: 3, missed: 3, distance: 520 })
  expect(g.saved).toBe(4)
})

test('LEVEL-04 the wormhole of mission 7 is the way home: it ends the run; those of missions 1 to 6 do not', () => {
  for (const level of [4, 6]) {
    const g = playing(level)
    intoWormhole(g)
    expect(g.state).toBe('between')
  }
  const g = playing(7)
  g.onboard = 5
  Object.assign(g, { distance: 9000.4, levelFrom: { distance: 5000, missed: 0 } })
  intoWormhole(g)
  expect(g.state).toBe('won')
  expect(g.saved).toBe(5)
  expect(g.results.map(r => r.level)).toEqual([7])
  expect(g.records.best).toBe(4000 * 5)
  expect(g.records.bestEnd).toEqual({ outcome: 'won', level: 7, finalDistance: 4000 })
})

test('LEVEL-06 a destroyed ship loses only the mission in flight: its row scores nothing and the banked score stays', () => {
  const g = playing()
  Object.assign(g, { distance: 400, onboard: 1, missed: 0 })
  intoWormhole(g)
  update(g, 0.8, 0); tryStart(g)
  Object.assign(g, { distance: g.distance + 250, onboard: 3, missed: 1, shields: 0, spawnTimer: 999, rescueTimer: 999 })
  g.asteroids.push(rock(g))
  step(g)
  expect(g.state).toBe('over')
  expect(g.results[1]).toEqual({ level: 2, saved: 0, lost: 3, missed: 1, distance: 250 })
  expect(g.lost).toBe(3)
  expect(g.records.best).toBe(400)      // mission 1 as banked: nothing taken off
  expect(g.records.bestEnd).toEqual({ outcome: 'over', level: 2, finalDistance: 0 })
})

test('LEVEL-05 a new run starts with no results', () => {
  const g = playing()
  intoWormhole(g)
  startGame(g)
  expect(g.results).toEqual([])
})

test('LEVEL-07 speed keeps rising with the parsecs flown: no second gear and no ceiling', () => {
  const g = playing()
  g.wormTimer = 1e9                     // no way out
  g.levelScore = 500 * 10               // ten times the target of mission 1
  step(g)
  expect(g.speed).toBeCloseTo(1 + 10 * 1.3)
  const before = g.speed
  for (let i = 0; i < 60; i++) step(g)
  expect(g.speed).toBeGreaterThan(before)
})

test('LEVEL-08 a missed wormhole returns after a wait dealt from the shuffled set: each wait once in every five', () => {
  const g = playing()
  g.levelScore = levelTarget(1); g.levelTime = 99
  const waits: number[] = []
  for (let i = 0; i < 10; i++) {
    g.wormhole = { x: 20, y: g.H + 100, r: 30 }   // far from the ship and already off the bottom
    step(g)
    expect(g.wormhole).toBeNull()
    waits.push(g.wormTimer)
  }
  const sorted = (a: number[]) => [...a].sort((x, y) => x - y)
  expect(sorted(waits.slice(0, 5))).toEqual(WORM_WAITS)
  expect(sorted(waits.slice(5))).toEqual(WORM_WAITS)
  // the first wormhole of a level does not wait at all
  const fresh = playing()
  fresh.levelScore = levelTarget(1); fresh.levelTime = 99
  step(fresh)
  expect(fresh.wormhole).not.toBeNull()
})

test('LEVEL-09 in mission 7 every wormhole arrives with a shield in the same row on the opposite side', () => {
  const sides = new Set<number>()
  for (let i = 0; i < 20; i++) {
    const g = playing(7)
    g.levelScore = levelTarget(7); g.levelTime = 99
    step(g)
    const w = g.wormhole!, [d] = g.drops
    expect(g.drops).toHaveLength(1)
    expect(d.y).toBeCloseTo(w.y)
    expect(d.x - g.W / 2).toBeCloseTo(-(w.x - g.W / 2))       // mirrored: equally easy to reach
    expect(Math.abs(w.x - d.x)).toBeGreaterThan(g.W * 0.35)   // too far apart to take both
    for (let k = 0; k < 30; k++) step(g)
    expect(d.y).toBeCloseTo(g.wormhole!.y)                    // and they stay in one row
    sides.add(Math.sign(w.x - d.x))
  }
  expect(sides.size).toBe(2)                                  // which side each is on is random
  // missions 1 to 6: a wormhole alone
  const g = playing(6)
  g.levelScore = levelTarget(6); g.levelTime = 99; g.dropCount = 4   // its own shield drops have all been and gone
  step(g)
  expect([!!g.wormhole, g.drops.length]).toEqual([true, 0])
})

test('LEVEL-10 shields: a drop adds one, a ship holds 5 at most, spares carry over, and a new mission tops up to 3', () => {
  const g = playing(5)
  g.shields = 4
  g.drops.push({ x: g.ship.x, y: g.ship.y, r: 16, fall: 0.9 })
  step(g)
  expect([g.shields, g.drops.length]).toEqual([5, 0])
  g.drops.push({ x: g.ship.x, y: g.ship.y, r: 16, fall: 0.9 })
  step(g)
  expect(g.shields).toBe(5)
  intoWormhole(g); update(g, 0.8, 0); tryStart(g)
  expect([g.level, g.shields]).toEqual([6, 5])                // spares are kept
  g.shields = 1
  g.spawnTimer = 999; g.rescueTimer = 999
  intoWormhole(g); update(g, 0.8, 0); tryStart(g)
  expect([g.level, g.shields]).toEqual([7, 3])                // topped up to 3
})

test('LEVEL-11 mission 5 offers 6 shields and mission 6 offers 4, evenly spaced over the first two-thirds; half arrive as a choice', () => {
  for (const [level, count] of [[5, 6], [6, 4], [4, 0], [7, 0]] as const) {
    const g = playing(level)
    g.wormTimer = 1e9
    const at: number[] = [], choices: number[] = []
    const target = levelTarget(level)
    while (g.levelScore < target * 1.5) {
      g.shields = 3; g.grace = 1; g.spawnTimer = 999; g.rescueTimer = 999
      const before = g.dropCount, planets = g.asteroids.filter(a => a.planet).length
      step(g)
      if (g.dropCount > before) {
        at.push(g.levelScore / target)
        // a choice: 2 crew and 3 crew on planetoids, in the same row as the shield
        if (g.asteroids.filter(a => a.planet).length > planets) {
          choices.push(g.dropCount)
          const row = g.asteroids.slice(-4)
          expect(row.map(a => a.people).sort()).toEqual([0, 0, 2, 3])
          for (const body of row) expect(Math.abs(body.y - g.drops[g.drops.length - 1].y)).toBeLessThan(2)
        }
      }
      g.asteroids = []; g.drops = []
    }
    expect(at).toHaveLength(count)
    at.forEach((share, i) => expect(share).toBeCloseTo((2 / 3) * (i + 1) / count, 1))
    expect(choices).toEqual(count === 6 ? [2, 4, 6] : count === 4 ? [2, 4] : [])
  }
})

test('LEVEL-12 crew make the ship heavy: it swells, steers slower and digs a deeper well; delivering them shrinks it back', () => {
  const reach = (crew: number) => {
    const g = playing(7)
    g.onboard = crew
    for (let i = 0; i < 60; i++) step(g, 1)
    return { r: g.ship.r, x: g.ship.x, mass: shipMass(g) }
  }
  const empty = reach(0), half = reach(16), full = reach(32)
  expect(empty.r).toBeCloseTo(13)
  expect(full.r).toBeCloseTo(22, 0)
  expect(half.r).toBeGreaterThan(empty.r)
  expect(full.x).toBeLessThan(half.x)                          // flew less far to the side in the same second
  expect(half.x).toBeLessThan(empty.x)
  expect([empty.mass, half.mass, full.mass]).toEqual([1, 1.8, 2.6])
  // level alone changes nothing: an empty ship is the same size on every mission
  const late = playing(7), early = playing(1)
  for (let i = 0; i < 30; i++) { step(late); step(early) }
  expect(late.ship.r).toBe(early.ship.r)
  // delivered at the wormhole: the ship shrinks back
  const g = playing(3)
  g.onboard = 8
  for (let i = 0; i < 60; i++) step(g)
  const loaded = g.ship.r
  intoWormhole(g); update(g, 0.8, 0); tryStart(g)
  g.spawnTimer = 999; g.rescueTimer = 999
  for (let i = 0; i < 90; i++) step(g)
  expect(g.ship.r).toBeLessThan(loaded)
  expect(g.ship.r).toBeCloseTo(13, 0)
})

test('LEVEL-13 missions 5 to 7 start faster', () => {
  const g = playing(4)
  intoWormhole(g); update(g, 0.8, 0); tryStart(g)
  g.spawnTimer = 999; g.rescueTimer = 999
  step(g)
  expect([g.level, Math.round(g.speed * 10) / 10]).toEqual([5, 1.4])
})

test('FIELD-01 the play field is one fixed shape; the window only scales and centres it', () => {
  const g = createGame(createRecords(null))
  expect([g.W, g.H, g.U]).toEqual([400, 720, 1])
  expect(fit(400, 720)).toEqual({ scale: 1, x: 0, y: 0 })
  expect(fit(800, 720)).toEqual({ scale: 1, x: 200, y: 0 })        // a wide window: bars at the sides
  expect(fit(390, 844)).toEqual({ scale: 0.975, x: 0, y: 71 })     // a tall phone: centred
  expect(fit(320, 568).scale).toBeCloseTo(568 / 720)               // a small phone: the whole field still fits
})

test('SEED-01 a run is dealt from its seed: the same seed and inputs give the same run, another seed another', () => {
  const fly = (seed: number) => {
    const g = createGame(createRecords(null))
    g.seed = seed
    startGame(g)
    const seen: number[] = []
    for (let i = 0; i < 600; i++) {
      g.shields = 3; g.grace = 1          // rocks cannot end the run
      step(g, i % 90 < 45 ? 1 : -1)
      if (i % 60 === 0) seen.push(g.asteroids.length, ...g.asteroids.map(a => a.x + a.y))
    }
    return seen
  }
  const first = fly(0x4f2a9c)
  seedRandom(12345)                        // whatever was dealt in between does not matter
  expect(fly(0x4f2a9c)).toEqual(first)
  expect(fly(0x4f2a9d)).not.toEqual(first)
})

test('SEED-02 the seed shown on the start screen is the first run\'s; every run after gets a new one', () => {
  const g = createGame(createRecords(null))
  const shown = g.seed
  expect(Number.isInteger(shown) && shown >= 0 && shown < 0x1000000).toBe(true)
  tryStart(g)
  expect([g.state, g.seed]).toEqual(['play', shown])
  const seeds = new Set([shown])
  for (let i = 0; i < 5; i++) {
    g.state = 'over'; g.stateTime = 1
    tryStart(g)
    seeds.add(g.seed)
  }
  expect(seeds.size).toBeGreaterThan(4)
})

test('LEVEL-14 a full ship is not charged for crew it has no seat for, until the mission\'s wormhole has appeared', () => {
  // a planetoid with `people` aboard drifts off the bottom, far from the ship
  const driftPast = (g: Game, people: number) => {
    g.asteroids.push({ ...rock(g), x: 30, y: g.H + 200, people, planet: true })
    step(g)
  }
  const g = playing(2)                  // 4 seats
  g.wormTimer = 1e9
  g.onboard = 4
  driftPast(g, 3)
  expect(g.missed).toBe(0)              // full, and no way out yet: no choice, no charge
  g.onboard = 3
  driftPast(g, 3)
  expect(g.missed).toBe(1)              // one seat was free: one of the three was the player's to take
  g.onboard = 0
  driftPast(g, 2)
  expect(g.missed).toBe(3)              // free seats: a miss is a miss
  // the wormhole shows: from now on staying is a choice, and a full ship pays for everyone who drifts past
  g.onboard = 4
  g.levelScore = levelTarget(2); g.levelTime = 99; g.wormTimer = 0
  step(g)
  expect(g.wormCount).toBe(1)
  driftPast(g, 3)
  expect(g.missed).toBe(6)
  g.wormhole = { x: 20, y: g.H + 100, r: 30 }   // missed: it is gone, but it has appeared
  step(g)
  driftPast(g, 2)
  expect(g.missed).toBe(8)
  // the next mission starts uncharged again
  intoWormhole(g); update(g, 0.8, 0); tryStart(g)
  g.spawnTimer = 999; g.rescueTimer = 999; g.wormTimer = 1e9
  g.onboard = 8
  driftPast(g, 4)
  expect([g.level, g.missed]).toEqual([3, 8])
})
