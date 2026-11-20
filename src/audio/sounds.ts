import type { SoundEvent } from '../game/events'

// Every sound in the game, as numbers to tune by ear. Nothing here has been
// heard by the owner yet. Try any of them in the browser console after a tap:
// `__sound.play('save')`, or a whole event: `__sound.event({ kind: 'missed', count: 3 })`.

/** One voice of a sound. Frequencies in Hz, times in seconds, gain 0–1. */
export interface Tone {
  wave: OscillatorType | 'noise'
  from: number          // starting frequency; for noise, a low-pass cut-off (0: unfiltered)
  to?: number           // frequency it glides to by the end; left out, it holds
  length: number
  gain: number
  at?: number           // starts this long after the sound does
}

const chord = (notes: number[], length: number, gain: number): Tone[] => notes.map(from => ({ wave: 'sine', from, length, gain }))

export type SoundName = 'save' | 'full' | 'missed' | 'impact' | 'shieldBreak' | 'lastShield' | 'shield' | 'pulse' | 'enter' | 'destroyed' | 'home' | 'click'

export const SOUNDS: Record<SoundName, Tone[]> = {
  save: [{ wave: 'square', from: 520, to: 700, length: 0.07, gain: 0.18 }],
  full: chord([523.25, 659.25, 783.99], 0.4, 0.16),
  missed: [{ wave: 'triangle', from: 330, to: 150, length: 0.3, gain: 0.4 }],
  // a hit is the impact, scaled by the rock's size (HIT), then the shield cracking,
  // and a falling warning when that was the last shield
  impact: [
    { wave: 'noise', from: 0, length: 0.2, gain: 0.5 },
    { wave: 'sine', from: 130, to: 45, length: 0.22, gain: 0.7 },
  ],
  shieldBreak: [{ wave: 'square', from: 1500, to: 280, length: 0.12, gain: 0.12, at: 0.02 }],
  lastShield: [
    { wave: 'square', from: 880, length: 0.09, gain: 0.14, at: 0.12 },
    { wave: 'square', from: 587, length: 0.16, gain: 0.14, at: 0.24 },
  ],
  shield: [{ wave: 'sine', from: 440, to: 1320, length: 0.22, gain: 0.35 }],
  pulse: [{ wave: 'sine', from: 120, to: 95, length: 0.35, gain: 0.6 }],
  enter: [
    { wave: 'sawtooth', from: 180, to: 1600, length: 0.6, gain: 0.18 },
    { wave: 'sine', from: 300, to: 2400, length: 0.6, gain: 0.2 },
  ],
  // a blow: a sharp crack, a boom whose low-pass closes down to a rumble, and a deep thud under both
  destroyed: [
    { wave: 'noise', from: 7000, to: 900, length: 0.16, gain: 0.9 },              // the crack
    { wave: 'noise', from: 2400, to: 110, length: 1.7, gain: 0.85, at: 0.02 },    // the boom, closing to a rumble
    { wave: 'sine', from: 150, to: 30, length: 0.55, gain: 1 },                   // the thud
    { wave: 'sine', from: 62, to: 26, length: 1.5, gain: 0.45, at: 0.06 },        // the sub rumble
  ],
  home: chord([523.25, 659.25, 783.99, 1046.5], 1.6, 0.14),
  click: [{ wave: 'square', from: 900, length: 0.035, gain: 0.18 }],
}

/** Semitones each seat raises a save note: a ship filling up is heard climbing. */
export const SAVE_STEP = 2
/** Delay between the notes of several crew left behind at once, in seconds. */
export const MISSED_GAP = 0.12
/** The choice's click per ship: a bigger ship clicks lower. */
export const CLICK_PITCH = [1, 0.75, 0.56]
/** The fleet's mark moving: the same click, quieter. */
export const MARK_GAIN = 0.6
/**
 * How a hit scales with the rock's radius, from the smallest rock (14) to the
 * biggest (50): the impact's pitch, loudness and length, each from small to big.
 */
export const HIT = { small: 14, big: 50, pitch: [1.3, 0.65], gain: [0.55, 1], stretch: [0.7, 1.7] }
/** A wormhole on the field pulses this often, from quiet at the top of the field to loud at the ship. */
export const PULSE = { every: 0.9, quiet: 0.2, loud: 1 }
/** Overall loudness. */
export const MASTER = 0.5

/** One sound to play for an event. `stopOthers` cuts everything still playing first. */
export interface Cue { sound: SoundName; pitch?: number; gain?: number; delay?: number; stretch?: number; stopOthers?: boolean }

/** What an event sounds like. */
export function cuesFor(e: SoundEvent): Cue[] {
  switch (e.kind) {
    case 'save': return [{ sound: 'save', pitch: 2 ** ((e.seat - 1) * SAVE_STEP / 12) }]
    case 'full': return [{ sound: 'full', delay: 0.08 }]
    case 'missed': return Array.from({ length: e.count }, (_, i) => ({ sound: 'missed' as const, delay: i * MISSED_GAP }))
    case 'hit': {                                // a crew member thrown off follows as `missed`: the same note as one left behind
      const k = Math.max(0, Math.min(1, (e.size - HIT.small) / (HIT.big - HIT.small)))
      const along = ([a, b]: number[]) => a + (b - a) * k
      const cues: Cue[] = [{ sound: 'impact', pitch: along(HIT.pitch), gain: along(HIT.gain), stretch: along(HIT.stretch) }, { sound: 'shieldBreak' }]
      if (e.shieldsLeft === 0) cues.push({ sound: 'lastShield' })
      return cues
    }
    case 'shield': return [{ sound: 'shield' }]
    case 'wormhole': return [{ sound: 'pulse', gain: PULSE.quiet }]
    case 'enter': return [{ sound: 'enter', stopOthers: true }]
    case 'home': return [{ sound: 'home', stopOthers: true }]
    case 'destroyed': return [{ sound: 'destroyed', stopOthers: true }]
    case 'choice': return [{ sound: 'click', pitch: clickPitch(e.ship) }]
    case 'mark': return [{ sound: 'click', pitch: clickPitch(e.ship), gain: MARK_GAIN }]
  }
}

const clickPitch = (ship: number) => CLICK_PITCH[Math.max(1, Math.min(ship, CLICK_PITCH.length)) - 1]
