import { expect, test } from 'vitest'
import { createGame, offer, seats } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { runSummary } from '../src/game/runSummary'
import { chooseSide, startGame, tryStart, update } from '../src/game/simulation'
import { handling, shipRadius, shipSeats } from '../src/game/tuning'
import type { Game } from '../src/game/types'

function playing(level = 1, ship = 1): Game {
  const g = createGame(createRecords(null))
  startGame(g)
  g.level = level
  g.shipType = ship
  g.spawnTimer = 999; g.rescueTimer = 999   // an empty sky
  return g
}

const step = (g: Game, steer = 0) => update(g, 1 / 60, steer)
const quiet = (g: Game) => { g.spawnTimer = 999; g.rescueTimer = 999 }

// Flies into a wormhole and waits until the results screen takes a tap.
function finish(g: Game) {
  quiet(g)
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  step(g)
  update(g, 0.8, 0)
}

const LEFT = 20, RIGHT = 380   // taps near the edges of the 400-wide field, where thumbs are

// Flies missions from the first, answering each stop with a tap at `taps[i]`; returns the game on the stop after the last.
function flyWith(taps: number[]): Game {
  const g = playing()
  for (const x of taps) { finish(g); tryStart(g, x) }
  finish(g)
  return g
}

test('SHIP-01 every run starts in the smallest ship, whatever the last run flew', () => {
  const g = playing()
  expect([g.shipType, seats(g), g.ship.r]).toEqual([1, 4, 13])
  Object.assign(g, { level: 6, shipType: 3, state: 'over', stateTime: 1 })
  tryStart(g)
  expect([g.state, g.level, g.shipType, seats(g), g.ship.r]).toEqual(['play', 1, 1, 4, 13])
})

test('SHIP-02 after missions 1, 3 and 5 there is nothing to choose: any tap or key moves on in the same ship', () => {
  for (const [level, ship] of [[1, 1], [3, 1], [3, 2], [5, 1], [5, 2], [5, 3]]) {
    for (const x of [undefined, LEFT, RIGHT]) {
      const g = playing(level, ship)
      finish(g)
      expect(offer(g)).toEqual([])
      chooseSide(g, 1)
      expect(g.state).toBe('between')      // a steering key alone does not move on
      tryStart(g, x)
      expect([g.state, g.level, g.shipType]).toEqual(['play', level + 1, ship])
    }
  }
})

test('SHIP-03 after missions 2 and 4 the ship in use and the next one up are on offer: left keeps, right upgrades', () => {
  for (const [level, ship] of [[2, 1], [4, 1], [4, 2]]) {
    const stop = () => { const g = playing(level, ship); finish(g); return g }
    expect(offer(stop())).toEqual([ship, ship + 1])

    const kept = stop(); tryStart(kept, LEFT)
    expect([kept.state, kept.level, kept.shipType]).toEqual(['play', level + 1, ship])
    const up = stop(); tryStart(up, RIGHT)
    expect([up.state, up.level, up.shipType]).toEqual(['play', level + 1, ship + 1])
    // the middle of the field is the border: just left of it keeps, on it upgrades
    const a = stop(); tryStart(a, 199); expect(a.shipType).toBe(ship)
    const b = stop(); tryStart(b, 200); expect(b.shipType).toBe(ship + 1)
    // a tap that lands outside the field counts for the nearer side
    const c = stop(); tryStart(c, -30); expect(c.shipType).toBe(ship)
    const d = stop(); tryStart(d, 460); expect(d.shipType).toBe(ship + 1)

    // on a keyboard: Space and Enter do not answer for the player; the arrows do
    const keys = stop(); tryStart(keys)
    expect(keys.state).toBe('between')
    chooseSide(keys, -1)
    expect([keys.state, keys.shipType]).toEqual(['play', ship])
    const right = stop(); chooseSide(right, 1)
    expect([right.state, right.level, right.shipType]).toEqual(['play', level + 1, ship + 1])
  }
})

test('SHIP-04 the choice waits for its 0.7 seconds like any other tap', () => {
  const g = playing(4, 2)
  quiet(g)
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  step(g)
  tryStart(g, RIGHT); chooseSide(g, 1)
  expect([g.state, g.shipType]).toEqual(['between', 2])
  update(g, 0.8, 0)
  tryStart(g, RIGHT)
  expect([g.state, g.shipType]).toEqual(['play', 3])
})

test('SHIP-05 one step at a time: always upgrading flies 4, 4, 8, 8, 12 and 12 seats in missions 1 to 6', () => {
  const g = flyWith([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT])   // the stops after missions 1 to 5
  expect(g.level).toBe(6)
  expect(g.results.map(r => r.ship)).toEqual([1, 1, 2, 2, 3, 3])
  expect(g.results.map(r => shipSeats(r.ship))).toEqual([4, 4, 8, 8, 12, 12])
})

test('SHIP-06 a declined upgrade is gone for the run: two stops, two steps', () => {
  const once = flyWith([LEFT, LEFT, RIGHT, RIGHT, RIGHT])  // declined after mission 2
  expect(once.results.map(r => r.ship)).toEqual([1, 1, 1, 1, 2, 2])   // the 8-seater offered again after mission 4
  expect(offer(once)).toEqual([1, 2])                        // the 12-seater is out of reach
  const late = flyWith([RIGHT, RIGHT, RIGHT, LEFT, RIGHT])   // took the 8-seater, declined the 12-seater
  expect(late.results.map(r => r.ship)).toEqual([1, 1, 2, 2, 2, 2])
  expect(offer(late)).toEqual([1, 2])
  const never = flyWith([LEFT, LEFT, LEFT, LEFT, LEFT])
  expect(never.results.map(r => r.ship)).toEqual([1, 1, 1, 1, 1, 1])
  // there is no going back down before the fleet
  const g = playing(4, 2)
  finish(g)
  expect(offer(g)).toEqual([2, 3])
})

test('SHIP-07 after mission 6 the fleet is on offer: every ship flown in this run, a smaller one included, nothing new', () => {
  const stop = () => flyWith([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT])
  expect(offer(stop())).toEqual([1, 2, 3])
  // each ship has its own third of the width
  ;[60, 200, 340].forEach((x, i) => {
    const g = stop()
    tryStart(g, x)
    expect([g.state, g.level, g.shipType]).toEqual(['play', 7, i + 1])
  })
  // a run that declined once has two ships, each in a half of the width; no bigger one is added
  const two = flyWith([RIGHT, LEFT, RIGHT, RIGHT, RIGHT])
  expect(offer(two)).toEqual([1, 2])
  tryStart(two, 399)
  expect(two.shipType).toBe(2)
  // a run that never upgraded has nothing to choose
  const one = flyWith([LEFT, LEFT, LEFT, LEFT, LEFT])
  expect(offer(one)).toEqual([1])
  tryStart(one)
  expect([one.state, one.level, one.shipType]).toEqual(['play', 7, 1])
})

test('SHIP-08 in the fleet a keyboard moves a mark from ship to ship and chooses with Space or Enter', () => {
  const g = flyWith([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT])
  expect(g.pick).toBe(3)                 // it starts on the ship in use
  chooseSide(g, 1)
  expect([g.pick, g.state]).toEqual([3, 'between'])   // nothing beyond the biggest
  chooseSide(g, -1)
  expect([g.pick, g.state]).toEqual([2, 'between'])
  for (let i = 0; i < 4; i++) chooseSide(g, -1)
  expect(g.pick).toBe(1)
  chooseSide(g, 1)
  tryStart(g)
  expect([g.state, g.level, g.shipType]).toEqual(['play', 7, 2])
})

test('SHIP-09 seats, size and steering are the ship\'s, in whatever mission it flies', () => {
  const fly = (level: number, ship: number) => {
    const g = playing(level, ship)
    for (let i = 0; i < 90; i++) step(g)                       // grown into its size
    const from = g.ship.x
    for (let i = 0; i < 20; i++) step(g, 1)
    return { r: g.ship.r, moved: g.ship.x - from, seats: seats(g) }
  }
  const all = [1, 2, 3].map(s => fly(7, s))
  expect(all.map(a => a.seats)).toEqual([4, 8, 12])
  all.forEach((a, i) => expect(a.r).toBeCloseTo(shipRadius(i + 1), 1))
  for (let i = 1; i < 3; i++) expect(all[i].moved).toBeLessThan(all[i - 1].moved * 0.95)   // each bigger ship is slower to the side
  expect(all[2].moved / all[0].moved).toBeCloseTo(handling(3) / handling(1), 1)
  // the same ship in an early and a late mission: the same seats and size
  expect([fly(2, 1).seats, fly(2, 1).r]).toEqual([fly(6, 1).seats, fly(6, 1).r])
  // a new ship grows into its size, not in one jump
  const g = playing(4, 2)
  for (let i = 0; i < 90; i++) step(g)
  finish(g); tryStart(g, RIGHT); quiet(g)
  step(g)
  expect(g.ship.r).toBeLessThan(shipRadius(2) + 0.5)
  for (let i = 0; i < 90; i++) { quiet(g); step(g) }
  expect(g.ship.r).toBeCloseTo(shipRadius(3), 1)
})

test('SHIP-10 a ship takes only as many crew as it seats: a small ship in a late mission fills from one planetoid', () => {
  const g = playing(6, 1)                // 4 seats
  g.wormTimer = 1e9
  g.asteroids.push({ x: g.ship.x, y: g.ship.y - 30, r: 24, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 6, planet: true })
  step(g)
  expect([g.onboard, g.asteroids[0].people]).toEqual([4, 2])
  // the two left on it had no seat: they are not missed
  g.asteroids[0].y = g.H + 200
  step(g)
  expect(g.missed).toBe(0)
})

test('SHIP-11 each mission is written down with its ship, and the run keeps the list', () => {
  const g = flyWith([LEFT, RIGHT, RIGHT])  // on the stop after mission 4
  expect(g.results.map(r => [r.level, r.ship])).toEqual([[1, 1], [2, 1], [3, 2], [4, 2]])
  tryStart(g, RIGHT); quiet(g)
  Object.assign(g, { shields: 0, grace: 0 })
  g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0 })
  step(g)
  expect(g.state).toBe('over')
  const run = runSummary(g)
  expect([run.level, run.ship, run.ships]).toEqual([5, 3, [1, 1, 2, 2, 3]])   // the unfinished mission included
})
