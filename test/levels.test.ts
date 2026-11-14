import { expect, test } from 'vitest'
import { createGame, layout } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { startGame, tryStart, update } from '../src/game/simulation'
import type { Game } from '../src/game/types'

function playing(): Game {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  startGame(g)
  g.spawnTimer = 999; g.rescueTimer = 999   // an empty sky
  return g
}

// Puts a wormhole on the ship and runs one frame, so the ship flies into it.
function intoWormhole(g: Game) {
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  update(g, 1 / 60, 0)
}

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

test('LEVEL-04 the last wormhole finishes the mission with no results screen', () => {
  const g = playing()
  g.level = 4
  g.onboard = 5
  intoWormhole(g)
  expect(g.state).toBe('won')
  expect(g.saved).toBe(5)
  expect(g.results.map(r => r.level)).toEqual([4])
})

test('LEVEL-06 a destroyed ship adds a row for the unfinished level, with the crew it cost', () => {
  const g = playing()
  Object.assign(g, { distance: 400, onboard: 1, missed: 2 })
  intoWormhole(g)
  update(g, 0.8, 0); tryStart(g)
  Object.assign(g, { distance: g.distance + 250, onboard: 3, missed: 3, shields: 0, spawnTimer: 999, rescueTimer: 999 })
  g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0 })
  update(g, 1 / 60, 0)
  expect(g.state).toBe('over')
  expect(g.results[1]).toEqual({ level: 2, saved: 0, lost: 3, missed: 1, distance: 250 })
})

test('LEVEL-05 a new run starts with no results', () => {
  const g = playing()
  intoWormhole(g)
  startGame(g)
  expect(g.results).toEqual([])
})

test('LEVEL-07 second gear starts only once twice the mission target has been flown', () => {
  const g = playing()
  g.spawnTimer = 999; g.rescueTimer = 999; g.wormTimer = 999   // an empty sky and no way out
  g.levelScore = 990                                           // mission 1 asks for 500
  update(g, 1 / 60, 0)
  expect(g.gearTime).toBe(0)
  g.levelScore = 1000
  for (let i = 0; i < 60; i++) update(g, 1 / 60, 0)
  expect(g.gearTime).toBeCloseTo(1)
  expect(g.speed).toBeCloseTo(1 + g.levelScore / 500 * 1.3 + 0.1, 1)   // first gear from progress, second on top
})
