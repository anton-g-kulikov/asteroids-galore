import { expect, test } from 'vitest'
import { createGame, layout } from '../src/game/game'
import { createRecords } from '../src/game/records'
import { startGame, update } from '../src/game/simulation'
import { spawnAsteroid, spawnDilemma, spawnRescue } from '../src/game/spawn'

function playing(level: number) {
  const g = createGame(createRecords(null))
  layout(g, 390, 844)
  startGame(g)
  g.level = level
  return g
}

test('SPAWN-01 stranded crew are on planetoids; plain rocks carry nobody', () => {
  const g = playing(3)
  for (let i = 0; i < 40; i++) { spawnRescue(g); spawnAsteroid(g) }
  for (const a of g.asteroids) expect(!!a.planet).toBe(a.people > 0)
  expect(g.asteroids.some(a => a.people > 1)).toBe(true)
})

test('SPAWN-02 on level 1 every planetoid has a single crew', () => {
  const g = playing(1)
  for (let i = 0; i < 60; i++) spawnRescue(g)
  expect(g.asteroids.every(a => a.planet && a.people === 1)).toBe(true)
})

test('SPAWN-03 a two-crew pair is two planetoids, with plain rocks as escorts', () => {
  const g = playing(2)
  spawnDilemma(g)
  expect(g.asteroids.map(a => [!!a.planet, a.people]).sort()).toEqual([[false, 0], [false, 0], [true, 1], [true, 2]])
})

test('SPAWN-05 flying across a planetoid costs no shield and leaves it whole; a rock does both', () => {
  for (const planet of [true, false]) {
    const g = playing(2)
    g.spawnTimer = 99; g.rescueTimer = 99
    spawnRescue(g)
    const body = g.asteroids[0]
    Object.assign(body, { planet, people: planet ? 1 : 0, x: g.ship.x, y: g.ship.y, vy: 0 })
    update(g, 1 / 60, 0)
    expect(g.shields).toBe(planet ? 3 : 2)
    expect(g.asteroids.includes(body)).toBe(planet)
    if (planet) expect(g.onboard).toBe(1)   // and the crew are picked up on the way
  }
})

test('SPAWN-04 level 1 never shows a two-crew pair, even when one is due', () => {
  for (const [level, crews] of [[1, [1]], [2, [1, 2]]] as const) {
    const g = playing(level)
    g.rescueCount = 2    // the next crew is the third: a pair, from level 2 on
    g.rescueTimer = 0
    g.spawnTimer = 99    // no ordinary rocks in the way
    update(g, 1 / 60, 0)
    expect(g.asteroids.filter(a => a.people).map(a => a.people).sort()).toEqual([...crews])
  }
})
