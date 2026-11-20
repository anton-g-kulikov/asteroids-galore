import { expect, test } from 'vitest'
import { createSoundPlayer, MUTE_KEY, type PlayerDeps } from '../../src/audio/player'
import { createGame } from '../../src/game/game'
import { createRecords } from '../../src/game/records'
import { SLOW_SCALE, SLOW_TIME } from '../../src/game/tuning'
import type { Game } from '../../src/game/types'

function setup(stored: Record<string, string> = {}) {
  const data = new Map(Object.entries(stored))
  const played: { sound: string; pitch: number; gain: number }[] = []
  const log: string[] = []
  let contexts = 0
  const deps: PlayerDeps = {
    storage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) },
    createAudio: () => {
      contexts++
      return {
        synth: { play: (sound, o) => void played.push({ sound, pitch: o.pitch, gain: o.gain }), stopAll: () => void log.push('stopAll') },
        resume: () => void log.push('resume'),
        suspend: () => void log.push('suspend'),
      }
    },
  }
  const g = createGame(createRecords(null))
  return { player: createSoundPlayer(deps), played, log, data, g, contexts: () => contexts }
}

const frame = (t: ReturnType<typeof setup>, g: Game = t.g, dt = 1 / 60) => t.player.frame(g, dt)

test('AUD-02 nothing plays before the first tap or key; the first one starts the audio once', () => {
  const t = setup()
  t.g.events.push({ kind: 'shield' })
  frame(t)
  expect([t.played, t.contexts(), t.g.events]).toEqual([[], 0, []])   // events are used up even so
  t.player.unlock(); t.player.unlock()
  expect(t.contexts()).toBe(1)
  t.g.events.push({ kind: 'shield' }, { kind: 'save', seat: 1, seats: 4 })
  frame(t)
  expect(t.played.map(p => p.sound)).toEqual(['shield', 'save'])
  expect(t.g.events).toEqual([])
})

test('AUD-03 muting stops everything and is remembered; unmuting clicks once', () => {
  const t = setup()
  t.player.unlock()
  t.player.toggleMute()
  expect([t.player.muted, t.data.get(MUTE_KEY)]).toEqual([true, '1'])
  expect(t.log).toContain('stopAll')
  t.g.events.push({ kind: 'shield' })
  frame(t)
  expect(t.played).toEqual([])
  // the next visit starts muted
  const next = setup({ [MUTE_KEY]: '1' })
  expect(next.player.muted).toBe(true)
  next.player.unlock()
  next.g.events.push({ kind: 'hit', size: 20, shieldsLeft: 2 })
  frame(next)
  expect(next.played).toEqual([])
  next.player.toggleMute()
  expect([next.player.muted, next.data.get(MUTE_KEY)]).toEqual([false, '0'])
  expect(next.played.map(p => p.sound)).toEqual(['click'])
  // a storage that throws does not break the game
  const broken = createSoundPlayer({ storage: { getItem() { throw new Error('x') }, setItem() { throw new Error('x') } }, createAudio: () => null })
  expect(broken.muted).toBe(false)
  broken.toggleMute()
  expect(broken.muted).toBe(true)
})

test('AUD-04 leaving the page suspends the audio; coming back resumes it', () => {
  const t = setup()
  t.player.setHidden(true)
  expect(t.log).toEqual([])                // never started: nothing to suspend
  t.player.unlock()
  t.log.length = 0
  t.player.setHidden(true)
  t.player.setHidden(false)
  expect(t.log).toEqual(['suspend', 'resume'])
  t.player.toggleMute(); t.log.length = 0
  t.player.setHidden(true); t.player.setHidden(false)
  expect(t.log).toEqual(['suspend'])       // muted: it stays quiet
})

test('AUD-05 during slow motion new sounds play lower, and at normal pitch after', () => {
  const t = setup()
  t.player.unlock()
  Object.assign(t.g, { state: 'play', slowmo: SLOW_TIME - 0.5 })   // at its depth
  t.g.events.push({ kind: 'shield' })
  frame(t)
  expect(t.played[0].pitch).toBeCloseTo(SLOW_SCALE)
  t.g.slowmo = 0
  t.g.events.push({ kind: 'shield' })
  frame(t)
  expect(t.played[1].pitch).toBe(1)
})

test('AUD-06 a wormhole on the field pulses, louder as it nears the ship, and stops when it is gone', () => {
  const t = setup()
  t.player.unlock()
  Object.assign(t.g, { state: 'play' })
  t.g.wormhole = { x: 200, y: 0, r: 30 }
  for (let i = 0; i < 120; i++) frame(t)                   // two seconds near the top
  const far = t.played.filter(p => p.sound === 'pulse')
  expect(far.length).toBeGreaterThanOrEqual(2)
  t.played.length = 0
  t.g.wormhole.y = t.g.ship.y - 40
  for (let i = 0; i < 120; i++) frame(t)
  const near = t.played.filter(p => p.sound === 'pulse')
  expect(near.length).toBeGreaterThanOrEqual(2)
  expect(near[0].gain).toBeGreaterThan(far[0].gain)
  t.played.length = 0
  t.g.wormhole = null
  for (let i = 0; i < 120; i++) frame(t)
  expect(t.played).toEqual([])
  // nor while muted
  t.g.wormhole = { x: 200, y: 300, r: 30 }
  t.player.toggleMute(); t.played.length = 0
  for (let i = 0; i < 120; i++) frame(t)
  expect(t.played).toEqual([])
})

test('AUD-07 entering a wormhole and losing the ship cut off what is still playing', () => {
  for (const kind of ['enter', 'destroyed'] as const) {
    const t = setup()
    t.player.unlock()
    t.g.events.push({ kind })
    frame(t)
    expect(t.log).toContain('stopAll')
    expect(t.played.length).toBeGreaterThan(0)
  }
  const t = setup()
  t.player.unlock()
  t.g.events.push({ kind: 'shield' })
  frame(t)
  expect(t.log).not.toContain('stopAll')
})
