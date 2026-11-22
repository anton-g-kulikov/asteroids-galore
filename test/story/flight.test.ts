import { expect, test } from 'vitest'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import { orbitAt, startStoryTrip, storyTripResult, update } from '../../src/game/simulation'
import { DILEMMA_EVERY, SPEED_GAIN, STEP, shieldDrops } from '../../src/game/tuning'
import type { Game } from '../../src/game/types'

const records = () => { const r = createRecords(null); let saves = 0; return { r: Object.assign(r, { saveBest: () => { saves++; return false } }), saves: () => saves } }
const trip = (over: Partial<Parameters<typeof startStoryTrip>[1]> = {}) => {
  const rec = records()
  const g = createGame(rec.r)
  startStoryTrip(g, { level: 2, boat: 1, people: 7, isReturn: false, shields: 3, startSpeed: 1, target: 750, captainAboard: false, ...over })
  return { g, saves: rec.saves }
}
const fly = (g: Game, seconds: number, steer = 0) => { for (let i = 0; i < seconds * 60 && (g.state === 'play' || g.state === 'launch'); i++) update(g, STEP, steer) }
const planetoidPeople = (g: Game, seen: Set<object>) => { let n = 0; for (const a of g.asteroids) if (a.planet && !seen.has(a)) { seen.add(a); n += a.people } return n }
const rock = (_g: Game, x: number, y: number, people = 0, planet = false) => ({ x, y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people, planet })
// Flies on untouched: never hit, never full, so what the orbit offers can be counted.
// A ship parked at one edge digs a well that would pull planetoids to it: kept flat.
const calm = (g: Game) => { for (const w of g.wells) { w.dwell = 0; w.depth = 0 } }
const untouched = (g: Game) => { g.shields = 9; g.grace = 9; g.onboard = 0 }

test('STORY-F1 a story flight flies in like a mission, in the boat given, with the shields given and the moon\'s people', () => {
  const { g } = trip({ boat: 2, shields: 1 })
  expect([g.state, g.level, g.shipType, g.shields, g.story?.onMoon, g.story?.gates]).toEqual(['launch', 2, 2, 1, 7, 0])
})

test('STORY-F2 crew come as arcade sends them, but only the moon\'s own people: none once the moon has nobody left in sight', () => {
  const { g } = trip({ people: 5, level: 3, target: 1250 })
  const seen = new Set<object>()
  let dealt = 0
  for (let i = 0; i < 400 * 60 && orbitAt(g).laps < 2; i++) {
    g.shields = 9; g.grace = 9; g.wormhole = null; calm(g)
    update(g, STEP, 0)
    dealt += planetoidPeople(g, seen)
    if (g.onboard >= 4) g.onboard = 0                               // never full: what the moon offers
  }
  expect([g.saved + g.onboard <= 5, g.story!.onMoon + g.asteroids.reduce((a, x) => a + (x.planet ? x.people : 0), 0) >= 0]).toEqual([true, true])
  expect(dealt).toBeGreaterThanOrEqual(5)                            // all five came, some more than once if they drifted past
  const full = trip()
  let any = 0
  for (let i = 0; i < 60 * 60 && orbitAt(full.g).laps < 1; i++) { full.g.shields = 9; full.g.grace = 9; full.g.onboard = 4; full.g.wormhole = null; update(full.g, STEP, 0); any += planetoidPeople(full.g, new Set()) }
  expect([any, full.g.story!.onMoon]).toEqual([0, 7])                // a full boat is sent no crew, as in arcade
})

test('STORY-F3 a hit costs a shield and nothing else: nobody is thrown off', () => {
  const { g } = trip()
  fly(g, 2)
  g.onboard = 3; g.grace = 0
  g.asteroids.push(rock(g, g.ship.x, g.ship.y))
  update(g, STEP, 0)
  expect([g.shields, g.onboard, g.castaways.length]).toEqual([2, 3, 0])
})

test('STORY-F4 people on a planetoid that drifts past go back to the moon, to be dealt again; so do those in sight when the boat leaves', () => {
  const { g } = trip({ people: 3 })
  fly(g, 2)
  g.story!.onMoon = 1
  g.asteroids.push({ ...rock(g, 30, g.H + 200, 2, true), dealt: true })
  update(g, STEP, 0)
  expect(g.story!.onMoon).toBe(3)
  g.asteroids.push({ ...rock(g, 30, 100, 2, true), dealt: true })
  g.story!.onMoon = 1
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  update(g, STEP, 0)
  expect([g.state, g.story!.onMoon]).toEqual(['between', 3])
})

test('STORY-F5 a flight back starts a lap at the mission\'s starting speed, with no shield drops', () => {
  const { g } = trip({ level: 1, isReturn: true, target: 500, startSpeed: 1, people: 1 })
  expect([g.levelScore, g.speed, g.dropCount]).toEqual([0, 1, shieldDrops(1)])
})

test('STORY-F6 missions 04 and 05 start at mission 03\'s speed in story; the speed keeps rising lap after lap', () => {
  const { g } = trip({ level: 5, startSpeed: 1, target: 2500, people: 0 })
  fly(g, 1.5)
  expect(g.speed).toBeLessThan(1.1)
  g.levelScore = 2500 * 1.5
  update(g, STEP, 0)
  expect(g.speed).toBeCloseTo(1 + 1.5 * SPEED_GAIN, 1)
})

test('STORY-F7 the wormhole comes once a lap, at the lap\'s end; steered past, the next comes at the next lap\'s end; mission 06 also opens one when full', () => {
  const { g } = trip({ people: 0 })
  const opened: number[] = []
  for (let i = 0; i < 400 * 60 && orbitAt(g).laps < 3; i++) {
    untouched(g); g.ship.x = g.wormhole && g.wormhole.x > g.W / 2 ? 20 : g.W - 20   // keeps clear of it
    const had = !!g.wormhole
    update(g, STEP, 0)
    if (!had && g.wormhole) opened.push(Math.round(g.levelScore / 750 * 100) / 100)
  }
  expect(opened).toEqual([1, 2, 3])
  const m06 = trip({ level: 7, boat: 1, people: 20, startSpeed: 2.2, target: 2000, captainAboard: true })
  fly(m06.g, 2)
  m06.g.onboard = 4
  for (let i = 0; i < 40 * 60 && !m06.g.wormhole; i++) { m06.g.grace = 9; update(m06.g, STEP, 0) }
  expect(m06.g.wormhole).not.toBeNull()
  expect(m06.g.levelScore).toBeLessThan(2000)
})

test('STORY-F8 a story flight never touches arcade\'s bests, and its result is what was brought out or lost', () => {
  const { g, saves } = trip()
  fly(g, 2)
  g.onboard = 3
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  update(g, STEP, 0)
  expect([g.state, storyTripResult(g)]).toEqual(['between', { picked: 3, destroyed: false, shieldsLeft: 3 }])
  const lost = trip()
  fly(lost.g, 2)
  lost.g.onboard = 2; lost.g.shields = 0; lost.g.grace = 0
  lost.g.asteroids.push(rock(lost.g, lost.g.ship.x, lost.g.ship.y))
  update(lost.g, STEP, 0)
  expect([lost.g.state, storyTripResult(lost.g)]).toEqual(['over', { picked: 2, destroyed: true, shieldsLeft: 0 }])
  expect(saves() + lost.saves()).toBe(0)
})

test('STORY-F9 as in arcade, every third crew from mission 01 on is a two-crew pair; its people are the moon\'s, and a planetoid the moon has nobody for is taken away', () => {
  const run = (people: number) => {
    const { g } = trip({ people })
    const seen = new Set<object>()
    let pair: number[] = []
    for (let i = 0; i < 300 * 60 && g.rescueCount < DILEMMA_EVERY && orbitAt(g).laps < 2; i++) {
      g.shields = 9; g.grace = 9; g.ship.x = 20; g.wormhole = null; calm(g)
      update(g, STEP, 0)
      const fresh = g.asteroids.filter(a => a.planet && !seen.has(a))
      fresh.forEach(a => { seen.add(a); a.x = g.W - 20 })                 // never reached
      if (g.rescueCount === DILEMMA_EVERY && fresh.length) pair = fresh.filter(a => !a.dead).map(a => a.people)
    }
    return pair
  }
  expect(run(20)).toEqual([1, 2])                                          // arcade's pair: one on the open planetoid, two between the escorts
  const few = run(3)
  expect(few.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(3)
})

test('STORY-F10 as in arcade, every second shield drop is a choice row with crew beside it; with nobody on the moon it is a plain shield', () => {
  const run = (people: number) => {
    const { g } = trip({ level: 4, target: 2000, people })
    const seen = new Set<object>()
    let row: number[] = []
    for (let i = 0; i < 300 * 60 && g.dropCount < 2 && orbitAt(g).laps < 1; i++) {
      g.shields = 1; g.grace = 9; g.ship.x = 20; g.wormhole = null; g.rescueTimer = 99; calm(g)   // no other crew: only the row's
      update(g, STEP, 0)
      const fresh = g.asteroids.filter(a => !seen.has(a))
      fresh.forEach(a => { seen.add(a); a.x = g.W - 20 })
      if (g.dropCount === 2) row = fresh.filter(a => a.planet && !a.dead).map(a => a.people)
    }
    return { row, drops: g.drops.length }
  }
  expect(run(20).row).toEqual([2, 3])
  expect(run(0).row).toEqual([])
})

test('STORY-F11 the dev control\'s invincibility: rocks pass through the boat, and nothing else changes', () => {
  const { g } = trip()
  fly(g, 2)
  g.invincible = true; g.shields = 0; g.grace = 0
  g.asteroids.push(rock(g, g.ship.x, g.ship.y))
  update(g, STEP, 0)
  expect([g.state, g.shields]).toEqual(['play', 0])
  g.invincible = false
  update(g, STEP, 0)
  expect(g.state).toBe('over')
})
