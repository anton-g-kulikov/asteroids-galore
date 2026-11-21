import type { SoundEvent } from '../game/events'
import { CHORDS } from '../music/score'

// The sound effects, v2: every event played on copies of the soundtrack's own
// instruments, on notes of the chord the music is on. The numbers are the
// sketch the owner approved after listening (2026-11-21). This file needs no
// audio: it says which instrument plays which notes, when, for how long and
// how loud. src/music/effects.ts plays them with Tone.js.

export type FxVoice = 'bell' | 'pad' | 'bass' | 'kick' | 'snare' | 'hat' | 'arp' | 'lead'

/** One instrument's part in a sound. Times in seconds from now; MIDI note numbers; `len` may be a Tone.js length. */
export interface FxNote {
  voice: FxVoice
  midi: number[]          // empty for the snare and hat
  at: number
  len: number | '16n' | '32n'
  vel: number
  slideTo?: number        // glide to this note over the length
  decay?: number          // the kick's or snare's decay, set for this trigger
  afterBell?: boolean     // counted from the last save's bell instead of from now
}

/** A whole sound. `cut` stops whatever is still playing first. */
export interface FxPlan { notes: FxNote[]; cut: boolean }

/** The rock sizes a hit scales between, as for the first sound effects. */
export const HIT_V2 = { small: 14, big: 50 }

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** 'A4' → 69. */
export const noteMidi = (n: string): number => PC[n[0]] + (n[1] === '#' ? 1 : 0) + 12 * (Number(n.slice(n[1] === '#' ? 2 : 1)) + 1)

/** That pitch class, in the octave nearest the target note. */
const near = (pc: number, target: number) => pc + 12 * Math.round((target - pc) / 12)
const lerp = (k: number, a: number, b: number) => a + (b - a) * k
const ms = (t: number) => Math.round(t * 1000) / 1000

/** What an event sounds like. `chord` is the music's chord (0 Am, 1 F, 2 C, 3 G); `semis` the slow motion's whole semitones. */
export function scoredFor(e: SoundEvent, chord: number, semis: number): FxPlan {
  const ch = CHORDS[chord] ?? CHORDS[0]
  const rootPc = noteMidi(ch.bass) % 12
  const root = (target: number) => near(rootPc, target) + semis
  const fifth = (target: number) => near((rootPc + 7) % 12, target) + semis
  const voicing = ch.pad.map(noteMidi)
  const note = (voice: FxVoice, midi: number[], at: number, len: FxNote['len'], vel = 1, more: Partial<FxNote> = {}): FxNote => ({ voice, midi, at, len, vel, ...more })
  const plan = (notes: FxNote[], cut = false): FxPlan => ({ notes, cut })

  switch (e.kind) {
    case 'save': {
      // the chord itself, one inversion higher for each seat; the 12-seater starts an octave lower
      const v = voicing.map(m => m + (e.seats > 8 ? 0 : 12) + semis)
      for (let i = 0; i < e.seat - 1; i++) { v.sort((a, b) => a - b); v[0] += 12 }
      return plan([note('bell', v, 0, 0.22)])
    }
    case 'full':                                       // the pad swells the chord; the lead holds its root on top
      return plan([
        note('pad', voicing.map(m => m + 12 + semis), 0.12, 0.5, 0.9, { afterBell: true }),
        note('lead', [root(81)], 0.17, 0.6, 0.6, { afterBell: true }),
      ])
    case 'missed': {                                   // the lead sighs from the chord's fifth down to its root
      const f = fifth(76)
      return plan(Array.from({ length: e.count }, (_, i) => note('lead', [f], ms(i * 0.12), 0.3, 0.9, { slideTo: f - 7 })))
    }
    case 'hit': {                                      // kick and snare sized by the rock, the bass on the root
      const k = Math.max(0, Math.min(1, (e.size - HIT_V2.small) / (HIT_V2.big - HIT_V2.small)))
      const r = root(33)
      const notes = [
        note('kick', [lerp(k, 33, 24) + semis], 0, lerp(k, 0.2, 0.5), lerp(k, 0.7, 1), { decay: lerp(k, 0.22, 0.5) }),
        note('snare', [], 0.02, '16n', lerp(k, 0.7, 1), { decay: 0.16 }),
        note('bass', [r], 0, lerp(k, 0.2, 0.4), lerp(k, 0.4, 0.65), { slideTo: r - 5 }),
      ]
      if (e.shieldsLeft === 0) { const f = fifth(76); notes.push(note('arp', [f], 0.12, 0.09), note('arp', [f - 7], 0.24, 0.16)) }   // the last shield: a warning
      return plan(notes)
    }
    case 'shield': {                                   // the arpeggio's root, fifth, octave
      const r = root(69)
      return plan([r, r + 7, r + 12].map((m, i) => note('arp', [m], ms(i * 0.06), 0.1)))
    }
    case 'wormhole':                                   // the first pulse; the player repeats it
      return scoredPulse(0.2, chord, semis)
    case 'enter': {                                    // the arpeggio races up the chord; the lead slides up two octaves
      const r = root(57), pcs = [...new Set(ch.arp.map(n => noteMidi(n) % 12))], climb: number[] = []
      for (let m = r; climb.length < 10; m++) if (pcs.includes(((m - semis) % 12 + 12) % 12)) climb.push(m)
      return plan([
        ...climb.map((m, i) => note('arp', [m], ms(i * 0.055), 0.07, ms(0.6 + i * 0.04))),
        note('lead', [r], 0, 0.6, 0.4, { slideTo: r + 24 }),
      ], true)
    }
    case 'home':                                       // the whole band lands on A major
      return plan([
        note('pad', ['A3', 'C#4', 'E4', 'A4'].map(n => noteMidi(n) + semis), 0, 1.6),
        note('bass', [33 + semis], 0, 1.2, 0.65),
        ...[69, 73, 76, 81].map((m, i) => note('arp', [m + semis], ms(i * 0.07), 0.12)),
        note('lead', [81 + semis], 0.3, 1.4, 0.5),
      ], true)
    case 'destroyed': {                                // everything falls, over a long kick and a burst of snare
      const r = root(33), f = fifth(76)
      return plan([
        note('kick', [21 + semis], 0, 0.9, 1, { decay: 0.9 }),
        note('snare', [], 0, 0.7, 1, { decay: 0.7 }),
        note('bass', [r], 0, 1.3, 0.65, { slideTo: r - 12 }),
        note('lead', [f], 0, 1.1, 0.5, { slideTo: f - 24 }),
      ], true)
    }
    case 'choice':
    case 'mark': {                                     // a hat tick and one arpeggio note, lower for a bigger ship
      const vel = e.kind === 'mark' ? 0.6 : 1
      return plan([
        note('hat', [], 0, '32n', vel),
        note('arp', [root(81) - 12 * (e.ship - 1) + (e.ship === 2 ? 7 : 0)], 0, 0.06, vel),
      ])
    }
  }
}

/** The wormhole's pulse: the bass on the root with a soft kick under it; `gain` is quiet far away, loud near. */
export function scoredPulse(gain: number, chord: number, semis: number): FxPlan {
  const rootPc = noteMidi((CHORDS[chord] ?? CHORDS[0]).bass) % 12
  return {
    cut: false,
    notes: [
      { voice: 'bass', midi: [near(rootPc, 45) + semis], at: 0, len: 0.35, vel: gain },
      { voice: 'kick', midi: [28 + semis], at: 0, len: 0.2, vel: gain * 0.5, decay: 0.32 },
    ],
  }
}

/**
 * When each instrument may start: never two notes at the same instant on one
 * instrument (Tone.js refuses), at least 30 ms apart, and 60 ms for the save's
 * bell so saves at once roll. The pad plays chords, so it needs no spacing.
 */
export function createSlots() {
  const last = new Map<FxVoice, number>()
  return {
    start(voice: FxVoice, t: number): number {
      if (voice === 'pad') return t
      const gap = voice === 'bell' ? 0.06 : 0.03
      const at = Math.max(t, (last.get(voice) ?? -Infinity) + gap)
      last.set(voice, at)
      return at
    },
    /** For ship full: `delay` after the last save's bell, or after `now` if that is later. */
    afterBell(now: number, delay: number): number {
      return Math.max(now, last.get('bell') ?? -Infinity) + delay
    },
  }
}
