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

test('SFX-06 once Tone.js has loaded, events and the pulse go to the v2 instruments with the chord and semitones', () => {
  const t = setup()
  const plans: { cut: boolean; first: string }[] = []
  const cut: string[] = []
  t.player.unlock()
  // before: as before
  t.g.events.push({ kind: 'shield' }); frame(t)
  expect(t.played.map(p => p.sound)).toEqual(['shield'])
  // after: to v2, on the chord the music reports
  let chord = 2
  t.player.attachEffects({ play: p => void plans.push({ cut: p.cut, first: `${p.notes[0].voice} ${p.notes[0].midi[0]}` }), stopAll: () => void cut.push('cut') }, () => chord)
  t.g.events.push({ kind: 'shield' }); frame(t)
  expect(plans).toEqual([{ cut: false, first: 'arp 72' }])               // C major's root nearest A4: C5
  expect(t.played).toHaveLength(1)                                       // nothing more on the old synth
  // slow motion: whole semitones
  Object.assign(t.g, { state: 'play', slowmo: SLOW_TIME - 0.5 }); chord = 0
  t.g.events.push({ kind: 'shield' }); frame(t)
  expect(plans[1].first).toBe('arp 64')                                  // A4 less 5
  t.g.slowmo = 0
  // the pulse
  t.g.wormhole = { x: 200, y: 0, r: 30 }; frame(t)
  expect(plans[2].first).toBe('bass 45')
  t.g.wormhole = null
  // muted: nothing, and v2 is cut
  t.player.toggleMute()
  expect(cut).toEqual(['cut'])
  t.g.events.push({ kind: 'shield' }); frame(t)
  expect(plans).toHaveLength(3)
})

test('SFX-09 in v2 a crew member thrown off by a hit has no cue of their own; crew left behind keep theirs', () => {
  const t = setup()
  const kinds: string[] = []
  t.player.unlock()
  t.player.attachEffects({ play: p => void kinds.push(p.notes.map(n => n.voice).join('+')), stopAll: () => {} }, () => 0)
  t.g.events.push({ kind: 'hit', size: 30, shieldsLeft: 2 }, { kind: 'missed', count: 1 }); frame(t)
  expect(kinds).toEqual(['pad+bass+arp'])                    // the hit's chord alone
  t.g.events.push({ kind: 'missed', count: 1 }); frame(t)
  expect(kinds.slice(1)).toEqual(['lead'])                   // left behind: the lead's falling note
  // before Tone.js has loaded, the first sound effects play both, as before
  const v1 = setup()
  v1.player.unlock()
  v1.g.events.push({ kind: 'hit', size: 30, shieldsLeft: 2 }, { kind: 'missed', count: 1 }); frame(v1)
  expect(v1.played.map(p => p.sound)).toContain('missed')
})
