import { expect, test } from 'vitest'
import { SOUNDS, cuesFor } from '../../src/audio/sounds'
import type { SoundEvent } from '../../src/game/events'

const all: SoundEvent[] = [
  { kind: 'save', seat: 1, seats: 4 }, { kind: 'full' }, { kind: 'missed', count: 2 }, { kind: 'hit', size: 20, shieldsLeft: 2 }, { kind: 'shield' },
  { kind: 'wormhole' }, { kind: 'enter' }, { kind: 'destroyed' }, { kind: 'home' }, { kind: 'choice', ship: 2 }, { kind: 'mark', ship: 1 },
]

test('AUD-01 every event has a sound from the one table; saves climb, bigger ships click lower, both costs end on one note', () => {
  for (const e of all) {
    const cues = cuesFor(e)
    expect(cues.length, e.kind).toBeGreaterThan(0)
    for (const c of cues) expect(SOUNDS[c.sound], `${e.kind} → ${c.sound}`).toBeDefined()
  }
  // every tone in the table is a handful of plain numbers
  for (const [name, tones] of Object.entries(SOUNDS)) {
    expect(tones.length, name).toBeGreaterThan(0)
    for (const t of tones) {
      expect(['sine', 'square', 'triangle', 'sawtooth', 'noise']).toContain(t.wave)
      expect(t.length).toBeGreaterThan(0)
      expect(t.gain).toBeGreaterThan(0)
      expect(t.gain).toBeLessThanOrEqual(1)
    }
  }
  // a save rises with the seat it fills
  const pitch = (seat: number) => cuesFor({ kind: 'save', seat, seats: 12 })[0].pitch ?? 1
  for (let s = 2; s <= 12; s++) expect(pitch(s)).toBeGreaterThan(pitch(s - 1))
  // one falling note per crew member left behind, one after another
  const missed = cuesFor({ kind: 'missed', count: 3 })
  expect(missed.map(c => c.sound)).toEqual(['missed', 'missed', 'missed'])
  expect(missed.map(c => c.delay ?? 0)).toEqual([...missed.map(c => c.delay ?? 0)].sort((a, b) => a - b))
  expect(new Set(missed.map(c => c.delay ?? 0)).size).toBe(3)
  // the hit carries no falling note of its own: the missed event that follows it does
  expect(cuesFor({ kind: 'hit', size: 20, shieldsLeft: 2 }).map(c => c.sound)).not.toContain('missed')
  // a bigger rock hits lower, louder and longer
  const impact = (size: number) => cuesFor({ kind: 'hit', size, shieldsLeft: 2 }).find(c => c.sound === 'impact')!
  const small = impact(14), mid = impact(30), big = impact(50)
  expect(small.pitch!).toBeGreaterThan(mid.pitch!); expect(mid.pitch!).toBeGreaterThan(big.pitch!)
  expect(small.gain!).toBeLessThan(mid.gain!); expect(mid.gain!).toBeLessThan(big.gain!)
  expect(small.stretch!).toBeLessThan(big.stretch!)
  expect(impact(5)).toEqual(small)                       // sizes outside the range sound like its ends
  expect(impact(80)).toEqual(big)
  // the shield takes it: a crack; the last shield gone: a warning as well
  const sounds = (shieldsLeft: number) => cuesFor({ kind: 'hit', size: 20, shieldsLeft }).map(c => c.sound)
  expect(sounds(2)).toEqual(['impact', 'shieldBreak'])
  expect(sounds(0)).toEqual(['impact', 'shieldBreak', 'lastShield'])
  // a bigger ship clicks lower
  const click = (ship: number) => cuesFor({ kind: 'choice', ship })[0].pitch ?? 1
  expect(click(2)).toBeLessThan(click(1))
  expect(click(3)).toBeLessThan(click(2))
  // a sweep that swallows the rest, and a long burst that ends everything
  expect(cuesFor({ kind: 'enter' })[0].stopOthers).toBe(true)
  expect(cuesFor({ kind: 'destroyed' })[0].stopOthers).toBe(true)
})

test('AUD-09 the ship destroyed sounds like a blow: a crack, a boom closing to a rumble, and a deep thud', () => {
  const tones = SOUNDS.destroyed
  const noise = tones.filter(t => t.wave === 'noise')
  const crack = noise.find(t => (t.at ?? 0) === 0 && t.from >= 4000)
  expect(crack, 'a sharp crack at once').toBeDefined()
  const boom = noise.find(t => t.from > 0 && t.to !== undefined && t.to <= 200 && t.length >= 1)
  expect(boom, 'a boom whose low-pass closes to a rumble').toBeDefined()
  const thud = tones.find(t => t.wave !== 'noise' && t.to !== undefined && t.to < 50 && (t.at ?? 0) === 0)
  expect(thud, 'a deep thud from the start').toBeDefined()
  expect(Math.max(...tones.map(t => (t.at ?? 0) + t.length))).toBeGreaterThan(1)
})
