import { expect, test } from 'vitest'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import { chooseSide, startGame, tryStart, update } from '../../src/game/simulation'
import { LAST_LEVEL, levelTarget } from '../../src/game/tuning'
import type { Game } from '../../src/game/types'

function playing(level = 1, ship = 1): Game {
  const g = createGame(createRecords(null))
  startGame(g)
  g.level = level
  g.shipType = ship
  g.spawnTimer = 999; g.rescueTimer = 999   // an empty sky
  g.events.length = 0
  return g
}

const step = (g: Game) => update(g, 1 / 60, 0)
const kinds = (g: Game) => g.events.map(e => e.kind)
const rock = (g: Game, over: object = {}) => ({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0, ...over })
const planet = (g: Game, people: number, over: object = {}) => rock(g, { y: g.ship.y - 30, r: 24, people, planet: true, ...over })

test('SND-01 each crew member taken aboard is a save on its own seat; the one that fills the ship is also full', () => {
  const g = playing(2, 1)                 // 4 seats
  g.wormTimer = 1e9
  g.asteroids.push(planet(g, 3))
  step(g)
  expect(g.events).toEqual([{ kind: 'save', seat: 1, seats: 4 }, { kind: 'save', seat: 2, seats: 4 }, { kind: 'save', seat: 3, seats: 4 }])
  g.events.length = 0
  g.asteroids.push(planet(g, 2))
  step(g)
  expect(g.events).toEqual([{ kind: 'save', seat: 4, seats: 4 }, { kind: 'full' }])
})

test('SND-02 crew left behind are reported with how many; a full ship drifting past reports nothing', () => {
  const g = playing(2, 1)
  g.wormTimer = 1e9
  g.asteroids.push(planet(g, 3, { x: 30, y: g.H + 200 }))   // drifts off with every seat free
  step(g)
  expect(g.events).toEqual([{ kind: 'missed', count: 3 }])

  g.events.length = 0
  g.onboard = 4
  g.asteroids.push(planet(g, 2, { x: 30, y: g.H + 200 }))
  step(g)
  expect(g.events).toEqual([])

  // a hit throws one off: the hit, then the same note as a crew left behind
  const hit = playing(3, 2)
  Object.assign(hit, { onboard: 3, grace: 0, shields: 3 })
  hit.asteroids.push(rock(hit))
  step(hit)
  expect(hit.events).toEqual([{ kind: 'hit', size: 20, shieldsLeft: 2 }, { kind: 'missed', count: 1 }])

  // the hit says how big the rock was and whether that was the last shield
  const last = playing(3, 2)
  Object.assign(last, { grace: 0, shields: 1 })
  last.asteroids.push(rock(last, { r: 46 }))
  step(last)
  expect(last.events).toEqual([{ kind: 'hit', size: 46, shieldsLeft: 0 }])

  // a rock with crew on it hits a full ship, which has no seat for them: one thrown off, and the two on the rock lost
  const crewed = playing(3, 2)
  Object.assign(crewed, { onboard: 8, grace: 0, shields: 2 })
  crewed.asteroids.push(rock(crewed, { people: 2 }))
  step(crewed)
  expect(crewed.events).toEqual([{ kind: 'hit', size: 20, shieldsLeft: 1 }, { kind: 'missed', count: 1 }, { kind: 'missed', count: 2 }])
})

test('SND-03 shields, wormholes, the way home, a destroyed ship and the choices between missions', () => {
  const g = playing(2, 1)
  g.wormTimer = 1e9
  g.drops.push({ x: g.ship.x, y: g.ship.y, r: 16, fall: 0 })
  step(g)
  expect(kinds(g)).toEqual(['shield'])

  // a wormhole appears once, and is entered
  const w = playing(2, 1)
  w.levelScore = levelTarget(2); w.levelTime = 99; w.wormTimer = 0
  step(w)
  expect(kinds(w)).toEqual(['wormhole'])
  for (let i = 0; i < 30; i++) step(w)
  expect(kinds(w)).toEqual(['wormhole'])
  w.wormhole = { x: w.ship.x, y: w.ship.y, r: 30 }
  step(w)
  expect(kinds(w)).toEqual(['wormhole', 'enter'])

  // the choice after mission 2: a click for the ship chosen
  update(w, 0.8, 0)
  w.events.length = 0
  tryStart(w, 380)
  expect(w.events).toEqual([{ kind: 'choice', ship: 2 }])
  // after mission 3 there is no choice: moving on is silent
  const three = playing(3, 2)
  three.wormhole = { x: three.ship.x, y: three.ship.y, r: 30 }
  step(three); update(three, 0.8, 0); three.events.length = 0
  tryStart(three)
  expect(three.events).toEqual([])

  // the fleet: moving the mark clicks too
  const fleet = playing(6, 2)
  fleet.results = [1, 1, 2, 2, 2].map((ship, i) => ({ level: i + 1, ship, saved: 0, missed: 0, distance: 100 }))
  fleet.wormhole = { x: fleet.ship.x, y: fleet.ship.y, r: 30 }
  step(fleet); update(fleet, 0.8, 0); fleet.events.length = 0
  chooseSide(fleet, -1)
  expect(fleet.events).toEqual([{ kind: 'mark', ship: 1 }])

  // home through the last wormhole
  const home = playing(LAST_LEVEL, 2)
  home.wormhole = { x: home.ship.x, y: home.ship.y, r: 30 }
  step(home)
  expect(kinds(home)).toEqual(['home'])

  // destroyed
  const lost = playing(3, 2)
  Object.assign(lost, { shields: 0, grace: 0 })
  lost.asteroids.push(rock(lost))
  step(lost)
  expect(kinds(lost)).toEqual(['destroyed'])
})
