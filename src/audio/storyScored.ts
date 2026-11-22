// The story screens' sounds (accepted by the owner, 2026-11-22: "Send as proposed"; the Music
// Producer's proposal, the Game Composer's spec). Like scored.ts, this needs no audio: it says
// which instrument plays which notes on the chord the music is on. effects.ts plays them; the
// open channel, the ring's swell and the Foreman's broken signal are wired there.

import { CHORDS } from '../music/score'
import { noteMidi, type FxNote, type FxPlan } from './scored'
import type { Mark, Voice } from '../story/view'

const near = (pc: number, target: number) => pc + 12 * Math.round((target - pc) / 12)
const tones = (chord: number) => {
  const ch = CHORDS[chord] ?? CHORDS[0]
  const r = noteMidi(ch.bass) % 12
  return {
    ch,
    root: (t: number) => near(r, t),
    fifth: (t: number) => near((r + 7) % 12, t),
    third: (t: number) => near((r + (chord === 0 ? 3 : 4)) % 12, t),   // A minor's third is minor; F, C and G are major
  }
}
/** The A-minor scale, for the Foreman's call: the scale step above a note. */
const A_MINOR = [9, 11, 0, 2, 4, 5, 7]
const stepAbove = (m: number) => { for (let x = m + 1; ; x++) if (A_MINOR.includes(x % 12)) return x }
const note = (voice: FxNote['voice'], midi: number[], at: number, len: FxNote['len'], vel = 1): FxNote => ({ voice, midi, at, len, vel })
const plan = (notes: FxNote[]): FxPlan => ({ notes, cut: false })

/** A transmission arriving: each voice's two-note call, as the sender's name appears. */
export function callPlan(voice: Voice, chord: number): FxPlan {
  const { root, fifth, third } = tones(chord)
  switch (voice) {
    case 'control': { const f = fifth(76); return plan([note('lead', [f], 0, 0.07, 0.72), note('lead', [f], 0.16, 0.07, 0.72)]) }
    case 'lantern': { const r = root(69); return plan([note('arp', [r], 0, 0.08, 0.92), note('arp', [r + 12], 0.12, 0.12, 0.92)]) }
    case 'first': return plan([note('bell', [root(69)], 0, 0.18), note('bell', [third(74)], 0.14, 0.3)])
    case 'survivor': return plan([note('piano', [third(74)], 0, 0.2, 0.36), note('piano', [fifth(79)], 0.14, 0.5, 0.33)])
    case 'foreman': { const lo = fifth(40); return plan([note('far', [stepAbove(lo)], 0, 0.3, 0.8), note('far', [lo], 0.22, 0.9, 0.7)]) }   // F2 to E2 under A minor
  }
}

/** The root the ring and the choice are built on. */
export const ringRoot = (chord: number): number => tones(chord).root(45)

/** The arpeggio climbing while the ring fills: root + 12, 19, 24, 31 at a quarter of the hold apart. */
export const ringSteps = (chord: number): { midi: number; share: number; vel: number }[] =>
  [12, 19, 24, 31].map((d, i) => ({ midi: ringRoot(chord) + d, share: i * 0.25, vel: [0.35, 0.45, 0.55, 0.65][i] }))

/** A choice made: root, fifth and octave, no third, the same for both sides; the two that can end the story are heavier. */
export function chosenPlan(heavy: boolean, chord: number): FxPlan {
  const r = ringRoot(chord)
  const notes = [
    note('bell', [r + 24, r + 31, r + 36], 0, heavy ? 1.2 : 0.5, 0.7),
    note('pad', [r + 12, r + 19, r + 24], 0, heavy ? 1.8 : 0.35, 0.5),
    note('arp', [r + 36], 0, 0.12, 0.6),
  ]
  if (heavy) notes.push(note('bass', [r - 12], 0, 2.4, 0.45))
  return plan(notes)
}

/** A count on the manifest, as it appears: its people in the sound they had in flight. Missing has none. */
export function countPlan(mark: Mark, chord: number): FxPlan {
  const { ch, root } = tones(chord)
  const pad = ch.pad.map(noteMidi)
  switch (mark) {
    case 'earth': return plan([note('bell', pad.map(m => m + 12), 0, 0.7)])
    case 'anotherShip': return plan([note('bell', pad, 0, 0.7)])
    case 'left': return plan([note('piano', [noteMidi('F5')], 0, 0.2, 0.85), note('piano', [noteMidi('E5')], 0.16, 0.7, 0.65)])
    case 'dead': { const r = root(45); return plan([note('pad', [r, r + 7, r + 12], 0, 0.6, 0.5), { ...note('bass', [r - 12], 0, 0.6, 0.35), slideTo: r - 17 }]) }
    default: return plan([])
  }
}

/** The lamp of the ending reached lights: one bell note. */
export const lampPlan = (chord: number): FxPlan => plan([note('bell', [tones(chord).root(81)], 0, 0.5)])

/** The channel closing: one small hat tick. */
export const channelClosePlan = (): FxPlan => plan([note('hat', [], 0, '64n', 0.3)])
