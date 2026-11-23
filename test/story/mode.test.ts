import { expect, test } from 'vitest'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import { update } from '../../src/game/simulation'
import { STEP } from '../../src/game/tuning'
import { createStoryMode } from '../../src/storyMode'
import type { StoryFlightEnd } from '../../src/story/flightRecord'
import type { StoryState } from '../../src/story/story'
import type { StoryScreenView } from '../../src/story/view'

function store() {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
}

// The page's frame, as main.ts runs it: story first, the game's steps unless story holds it, then story again.
function page() {
  const g = createGame(createRecords(null))
  const flights: (StoryFlightEnd | 'started')[] = []
  const sm = createStoryMode({
    game: g, store: store(), search: '?dev', callsign: () => 'COSMIC OTTER 42', onArcade: () => {},
    flights: { started: () => void flights.push('started'), ended: f => void flights.push(f) },
  })
  const frame = () => { sm.beforeSteps(STEP); if (!sm.holdsGame) { g.events.length = 0; update(g, STEP, 0) } sm.afterSteps() }
  const frames = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) frame() }
  const press = (key: string) => { sm.key(key, true, false); sm.key(key, false, false) }
  const hold = (key: string, seconds = 1.4) => { sm.key(key, true, false); frames(seconds); sm.key(key, false, false) }
  /** Taps through a screen until its choice is up (or it waits for a tap with nothing left). */
  const readOn = () => { for (let i = 0; i < 30 && !(sm.debug.screen() as StoryScreenView | null)?.choice && sm.debug.mode() === 'screen'; i++) { press(' '); frame() } }
  const st = () => sm.debug.state() as StoryState
  const scr = () => sm.debug.screen() as StoryScreenView | null
  return { g, sm, frame, frames, press, hold, readOn, st, scr, flights }
}

test('STORY-P01 going back after a flight starts the next flight: a choice held to its end never ends a flight that has not begun', () => {
  const { g, sm, frames, press, hold, readOn, st, scr } = page()
  press('ArrowRight')                                                 // the start screen's STORY
  readOn()
  expect(sm.debug.mode()).toBe('picker')
  hold('ArrowLeft')                                                   // the four
  expect(sm.debug.mode()).toBe('flight')
  frames(3)
  g.onboard = 2
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }                    // through a wormhole with two aboard
  frames(0.1)
  expect([sm.debug.mode(), g.state, st().saved[0]]).toEqual(['screen', 'between', 2])
  readOn(); press(' '); readOn()
  expect(scr()!.choice!.left).toEqual(['GO BACK', 'FOR 4'])
  hold('ArrowLeft')                                                   // GO BACK
  frames(1.5)                                                         // past the fly-in
  expect([sm.debug.mode(), g.state, st().saved[0], st().trips]).toEqual(['flight', 'play', 2, 1])
})

test('STORY-P02 after a lost boat, the boat picked to go back flies: it is not lost in the same moment', () => {
  const { g, sm, frames, press, hold, readOn, st } = page()
  press('ArrowRight'); readOn(); hold('ArrowLeft')
  frames(3)
  g.shields = 0; g.grace = 0; g.invincible = false
  g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0 })
  frames(0.1)
  expect([sm.debug.mode(), g.state, st().boats]).toEqual(['screen', 'over', ['lost', 'ready', 'ready']])
  readOn(); press(' '); readOn()
  hold('ArrowLeft')                                                   // GO BACK: the picker
  expect(sm.debug.mode()).toBe('picker')
  hold('ArrowRight')                                                  // the twelve
  frames(1.5)
  expect([sm.debug.mode(), g.state, st().boats, st().boat]).toEqual(['flight', 'play', ['lost', 'ready', 'ready'], 3])
})

test('STORY-P03 each flight is reported as it takes off and as it ends, once each, with how it went', () => {
  const { g, sm, frames, press, hold, readOn, flights } = page()
  press('ArrowRight'); readOn(); hold('ArrowLeft')                    // the four, to m00n
  frames(3)
  expect(flights).toEqual(['started'])
  g.onboard = 2
  g.wormhole = { x: g.ship.x, y: g.ship.y, r: 30 }
  frames(0.5)
  expect(flights).toEqual(['started', { moon: 0, boat: 1, isReturn: false, picked: 2, destroyed: false, laps: 0, dev: true }])
  readOn(); press(' '); readOn()
  hold('ArrowLeft')                                                   // GO BACK
  frames(3)
  g.shields = 0; g.grace = 0; g.invincible = false
  g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, shape: [1], craters: [], vx: 0, vy: 0, rot: 0, spin: 0, shade: 0, gy: 0, people: 0 })
  frames(0.5)
  expect(flights.slice(2)).toEqual(['started', { moon: 0, boat: 1, isReturn: true, picked: 0, destroyed: true, laps: 0, dev: true }])
  expect(sm.debug.mode()).toBe('screen')
})
