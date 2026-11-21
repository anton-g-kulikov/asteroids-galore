import { SLOW_SCALE, SLOW_TIME } from '../game/tuning'
import { timeScale } from '../game/timeScale'

// The music: one synthwave loop in A minor, Am–F–C–G two bars each, in layers
// that come in as the ship speeds up. Every number here is the sketch the
// owner listened to (2026-11-21), carried over as it was; tune them by ear on
// the listening page (`npm run dev`, then /audition.html).
//
// This file needs no audio: it says what plays on each sixteenth note. The
// sound itself is made by engine.ts with Tone.js.

export const MUSIC = {
  tempo: { base: 96, perSpeed: 14, max: 140, results: 90 },   // BPM at 1x, per 1x more, at most, between missions
  from: { pad: 0, bass: 1.3, drums: 1.7, arp: 2.0, lead: 2.2 }, // the speed at which each layer comes in
  hats16From: 2.8,                                             // sixteenth-note hats from this speed
  layerWait: 4,                                                // the arpeggio waits for 4 bars of drums, the lead for 4 bars of arpeggio (the owner's word)
  slack: 0.05,                                                 // a layer leaves only this far below where it came in
  leadBars: 32,                                                // the lead plays at most this many bars at a stretch (the owner's word)...
  leadPause: 16,                                               // ...then rests this many before starting again from the top
  leadFade: 2,                                                 // and fades out over its last this-many bars (the owner's word)
  // The lead's entries take turns, in a cycle of three: semitones from the melody as written, and which
  // effects it plays through (the owner's word, 2026-11-21: two octaves down with the long reverb, then
  // one octave down with the longer echo, twice).
  leadTurns: [{ semis: -24, fx: 'hall' }, { semis: -12, fx: 'echo' }, { semis: -12, fx: 'echo' }] as { semis: number; fx: LeadFx }[],
  restEvery: 16,                                               // a one-bar rest at most once in this many bars, in the last of them
  restAfter: 16,                                               // a layer can rest only after playing this many bars since it came in
  menuSpeed: 2.0,                                              // the start screen's music, once its note is tapped, has every layer and the pad's filter of this speed...
  menuBpm: 96,                                                 // ...at this tempo (the owner: "slow down the start screen music"; 96 heard and confirmed on the sound page)
  bassFromMission: 2,                                          // from this mission the bass plays from the start, whatever the speed (the owner's word)
  slow: { tempo: 0.6, semis: -5, cutoff: 700 },                // slow motion at its depth
  level: -12,                                                  // the music's bus, in dB
  limiter: -1,                                                 // then a limiter, in dB
  drop: 0.5,                                                   // a wormhole drops all but the pad over this many seconds
  // The ship destroyed: the music fades out over `fade` while the tempo ramps to `bpm`; then the
  // game-over screen's bass alone, a note of `len` seconds every `every` sixteenths, the first
  // `first` sixteenths after the loss, on these roots in turn (the gap and the order are the Music
  // Producer's reading of the owner's "very infrequent"; the rest is the owner's word, 2026-11-21).
  over: { fade: 1.5, bpm: 60, every: 24, first: 8, len: 2.4, vel: 0.8, roots: ['A1', 'F1', 'C2', 'G1'] },
  stopHome: 2.5,                                               // home: it fades over this long
}

export type LayerId = 'pad' | 'bass' | 'drums' | 'arp' | 'lead'

/** The lead's two sets of effects: the long reverb, or the longer echo. */
export type LeadFx = 'hall' | 'echo'

/** Fades, in seconds, as a layer comes in and leaves. */
export const LAYERS: { id: LayerId; fadeIn: number; fadeOut: number }[] = [
  { id: 'pad', fadeIn: 2, fadeOut: 1.5 },
  { id: 'bass', fadeIn: 0.02, fadeOut: 1.2 },
  { id: 'drums', fadeIn: 0.02, fadeOut: 1.2 },
  { id: 'arp', fadeIn: 0.4, fadeOut: 1.5 },
  { id: 'lead', fadeIn: 0.3, fadeOut: 1.5 },
]

export const CHORDS = [
  { name: 'Am', bass: 'A1', pad: ['A3', 'C4', 'E4', 'B4'], arp: ['A4', 'C5', 'E5', 'G5', 'A5'] },
  { name: 'F', bass: 'F1', pad: ['F3', 'A3', 'C4', 'E4'], arp: ['F4', 'A4', 'C5', 'E5', 'F5'] },
  { name: 'C', bass: 'C2', pad: ['G3', 'C4', 'E4', 'G4'], arp: ['E4', 'G4', 'C5', 'E5', 'G5'] },
  { name: 'G', bass: 'G1', pad: ['G3', 'B3', 'D4', 'G4'], arp: ['D4', 'G4', 'B4', 'D5', 'G5'] },
]
export const BASS = [0, 0, 12, 0, 0, 12, 0, 12]   // eighth notes, semitones above the chord's root
export const ARP = [0, 1, 2, 4, 3, 2, 1, 2]       // eighth notes, into the chord's five notes

/**
 * The lead's melody, as the owner wrote it (2026-11-21; the first half's last bars rewritten the same day
 * as four half-bar notes, D5 C5 B4 C5): two eight-bar halves over Am–F–C–G, as
 * [start, note, length], in sixteenths from the half's first bar. The halves are the same on purpose.
 */
export const MELODY: [number, string, number][][] = [
  [[0, 'A4', 4], [4, 'C5', 4], [8, 'E5', 24], [32, 'A4', 4], [36, 'C5', 4], [40, 'F5', 24], [64, 'E5', 8], [72, 'G5', 16], [88, 'E5', 8], [96, 'D5', 8], [104, 'C5', 8], [112, 'B4', 8], [120, 'C5', 8]],
  [[0, 'A4', 4], [4, 'C5', 4], [8, 'E5', 24], [32, 'A4', 4], [36, 'C5', 4], [40, 'F5', 24], [64, 'E5', 8], [72, 'G5', 16], [88, 'E5', 8], [96, 'D5', 28]],
]
/** A melody note lasts this share of its written length. */
export const MELODY_LENGTH = 0.95
const HALF = 128                                  // sixteenths in an eight-bar half
const melodyAt = MELODY.map(half => new Map(half.map(([at, note, len]) => [at, { note, len }])))

/** How much of each layer goes to the reverb. */
export const SEND: Record<LayerId, number> = { pad: 0.35, lead: 0.32, bass: 0.04, drums: 0.12, arp: 0.3 }

/** The instruments, as Tone.js settings. */
export const INSTRUMENTS = {
  masterLowpass: { frequency: 18000, type: 'lowpass', rolloff: -12 },
  reverb: { decay: 3.2, preDelay: 0.03, wet: 1 },
  padFilter: { frequency: 600, type: 'lowpass', rolloff: -24, Q: 0.8 },
  chorus: { frequency: 0.5, delayTime: 3.5, depth: 0.6, wet: 0.5 },
  pad: { oscillator: { type: 'fatsawtooth', count: 3, spread: 26 }, envelope: { attack: 0.9, decay: 0.5, sustain: 0.75, release: 2.2 }, volume: -16 },
  bass: {
    oscillator: { type: 'sawtooth' },
    filter: { Q: 3, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.004, decay: 0.18, sustain: 0.35, release: 0.08 },
    filterEnvelope: { attack: 0.003, decay: 0.14, sustain: 0.15, release: 0.1, baseFrequency: 110, octaves: 3.2 },
    volume: -6,
  },
  kick: { pitchDecay: 0.035, octaves: 7, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.05 }, volume: -9 },
  snareHighpass: 1200,
  snare: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 }, volume: -15 },
  snareBody: { pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 }, volume: -18 },
  hatHighpass: 7500,
  hat: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 }, volume: -24 },
  arpDelay: { delayTime: 0.47, feedback: 0.32, wet: 0.28 },
  arpLowpass: 3200,
  arp: { oscillator: { type: 'pulse', width: 0.28 }, envelope: { attack: 0.004, decay: 0.22, sustain: 0.18, release: 0.15 }, volume: -21 },
  // the lead: a synthesized piano, a string tone with eight harmonics that rings on under a short
  // bright hammer strike (the owner's choice, 2026-11-21); no glide, so notes ring over each other
  pianoBody: {
    oscillator: { type: 'custom', partials: [1, 0.8, 0.55, 0.4, 0.28, 0.18, 0.12, 0.08] },
    envelope: { attack: 0.003, decay: 2.6, sustain: 0, release: 1.6 }, volume: -4,   // balanced on a meter (the owner: "balance lead volume with other tracks")
  },
  pianoHammer: {
    harmonicity: 3, modulationIndex: 6, oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 },
    modulationEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 }, volume: -10,
  },
  // its two sets of effects, by turn: an echo into a reverb, then a level so both are as loud on average
  leadFx: {
    // echoes of `beats` beats, set from the tempo (the owner liked them pulsing with it); room for 2.5 s
    hall: { beats: 0.75, delay: { delayTime: 0.47, maxDelay: 2.5, feedback: 0.45, wet: 0.3 }, reverb: { decay: 7, preDelay: 0.03, wet: 0.38 }, trim: 0 },
    echo: { beats: 1.5, delay: { delayTime: 0.94, maxDelay: 2.5, feedback: 0.6, wet: 0.42 }, reverb: { decay: 3, preDelay: 0.02, wet: 0.22 }, trim: 1 },
  },
  duck: { to: 0.45, back: 0.24 },              // pad and bass under the kick: down to 45%, back in 0.24 s
  padLength: 0.92,                             // a pad chord lasts this share of its two bars
  // the game-over screen's bass: its own voice, on the music's output after the fade
  endBass: {
    oscillator: { type: 'sawtooth' },
    filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.05, decay: 1.2, sustain: 0.3, release: 2.5 },
    filterEnvelope: { attack: 0.04, decay: 1.0, sustain: 0.2, release: 2, baseFrequency: 90, octaves: 2.4 },
    volume: -8,
  },
  endBassSend: 0.3,
} as const

/**
 * What the music is doing: nothing, the run's loop, the start screen's loop (every layer, at the tempo
 * of MUSIC.menuSpeed), the pad between missions, or the game-over screen's bass.
 */
export type Mode = 'silent' | 'flying' | 'menu' | 'results' | 'over'

export const bpmFor = (speed: number): number => Math.min(MUSIC.tempo.max, MUSIC.tempo.base + MUSIC.tempo.perSpeed * (speed - 1))

/**
 * The game-over screen's bass on sixteenth `s` counted from the ship's loss: a root to play, with
 * the chord it belongs to (for the sound effects), or null. A, F, C and G are chords 0 to 3.
 */
export function endBassStep(s: number): { note: string; chord: number } | null {
  const { first, every, roots } = MUSIC.over
  if (s < first || (s - first) % every !== 0) return null
  const i = ((s - first) / every) % roots.length
  return { note: roots[i], chord: i }
}

/** 0 with no slow motion, 1 at its depth, following the game's time scale. */
export const slowDepth = (slowmo: number): number => (1 - timeScale(slowmo)) / (1 - SLOW_SCALE)

/** Tempo, the pad's filter, the slow-motion low-pass and the arpeggio's echo for a moment of the game. */
export function controlFor(mode: Mode, speed: number, depth: number) {
  if (mode === 'menu') speed = MUSIC.menuSpeed          // the start screen: the pad's filter of 2x, at its own tempo
  const base = mode === 'results' ? MUSIC.tempo.results : mode === 'over' ? MUSIC.over.bpm : mode === 'menu' ? MUSIC.menuBpm : bpmFor(speed)
  const bpm = base * (1 - (1 - MUSIC.slow.tempo) * depth)
  return {
    bpm,
    arpDelay: 60 / bpm * 0.75,
    padCutoff: mode === 'results' || mode === 'over' ? 520 : Math.min(4200, 600 + 900 * (speed - 1)),
    masterCutoff: 18000 * (MUSIC.slow.cutoff / 18000) ** depth,
  }
}

/**
 * Whether a layer should play by speed; one that is in leaves only `slack`
 * below where it came in, so it does not flicker. The lead also waits for the
 * arpeggio and for the top of a half: see the sequencer.
 */
export function wanted(id: LayerId, mode: Mode, speed: number, on: boolean, level = 1): boolean {
  if (mode === 'results') return id === 'pad'
  if (mode === 'menu') return true                      // the start screen: every layer, each still waiting its turn in the sequencer
  if (mode !== 'flying') return false
  if (id === 'bass' && level >= MUSIC.bassFromMission) return true
  const from = MUSIC.from[id]
  return speed >= (on ? from - MUSIC.slack : from)
}

export type Voice = 'pad' | 'bass' | 'kick' | 'snare' | 'snareBody' | 'hat' | 'arp' | 'lead'

/** A note to play now. `dur` is a Tone.js length, 'pad' for a pad chord, or 'melody' for `len` sixteenths at the current tempo. */
export interface Note { voice: Voice; notes: string[]; semis: number; dur: string; vel: number; len?: number; fx?: LeadFx }

export interface Step {
  gates: { id: LayerId; on: boolean }[]   // layers coming in or leaving now
  fades: { id: LayerId; bars: number }[]  // layers to fade to silence over this many bars, while still playing
  notes: Note[]
  duck: boolean                           // the kick plays with the drums in: pad and bass duck
  rest: LayerId | null                    // the layer resting in this bar
}

export interface Sequencer {
  /** What plays on sixteenth note `s` of the loop (counted from its start). */
  step(s: number, at: { mode: Mode; speed: number; depth: number; level?: number }): Step
  /** Takes layers out at once, as a wormhole does; the engine fades them. */
  drop(ids: LayerId[]): void
  readonly gates: Record<LayerId, boolean>
}

/** `rand` decides the rests. It is Math.random in the game: never the run's seeded numbers. */
export function createSequencer(rand: () => number): Sequencer {
  const gates: Record<LayerId, boolean> = { pad: false, bass: false, drums: false, arp: false, lead: false }
  let rest: LayerId | null = null, lastRest: LayerId | null = null
  const since: Partial<Record<LayerId, number>> = {}   // the step each layer last came in
  let leadSince = -1, leadRestUntil = -1          // when the lead came in; until when it rests after a full stretch
  // Each time the melody is played through (16 bars, counted from the lead's entry) takes the next of
  // MUSIC.leadTurns, and the lead leaving counts as the end of a pass, however far it got. A new
  // sequencer (a new run) starts at the first turn again.
  let leadPass = 0
  return {
    gates,
    drop(ids) { for (const id of ids) { if (id === 'lead' && gates.lead) leadPass++; gates[id] = false } },
    step(s, { mode, speed, depth, level = 1 }) {
      const s16 = s % 16, bar = Math.floor(s / 16) % 8, ch = CHORDS[bar >> 1]
      const chordStart = s16 === 0 && bar % 2 === 0
      const changes: Step['gates'] = []
      const fades: Step['fades'] = []
      if (chordStart) {
        for (const { id } of LAYERS) {
          let on = wanted(id, mode, speed, gates[id], level)
          // each layer waits for the one under it to have played `layerWait` bars
          const under = id === 'arp' ? 'drums' : id === 'lead' ? 'arp' : null
          if (on && !gates[id] && under && (!gates[under] || s - (since[under] ?? s) < MUSIC.layerWait * 16)) on = false
          if (id === 'lead') {
            // at most `leadBars` at a stretch, then a rest of `leadPause` bars
            if (on && gates.lead && s - leadSince >= MUSIC.leadBars * 16) { on = false; leadRestUntil = s + MUSIC.leadPause * 16 }
            // ...fading out over its last bars, so the fade ends with the stretch rather than reaching into the next
            if (on && gates.lead && s - leadSince === (MUSIC.leadBars - MUSIC.leadFade) * 16) fades.push({ id: 'lead', bars: MUSIC.leadFade })
            // it comes in last: after the arpeggio's 4 bars (above), only at the top of a half, and not while resting
            if (on && !gates.lead && (s % HALF !== 0 || s < leadRestUntil)) on = false
            if (on && !gates.lead) leadSince = s
            if (!on && gates.lead) leadPass++
          }
          if (on && !gates[id]) since[id] = s
          if (on !== gates[id]) { gates[id] = on; changes.push({ id, on }) }
        }
      }
      // from mission 2 the bass does not wait for a chord change: it comes in at the first bar line
      if (s16 === 0 && !chordStart && !gates.bass && mode === 'flying' && level >= MUSIC.bassFromMission) {
        gates.bass = true; since.bass = s; changes.push({ id: 'bass', on: true })
      }
      // A one-bar rest at most once in every 16 bars, in the last of them, so the layer is back on the
      // next downbeat: for a layer that has played 16 bars since it came in, never the same one twice running.
      if (s16 === 0) {
        rest = null
        if (s % (MUSIC.restEvery * 16) === (MUSIC.restEvery - 1) * 16) {
          const ready = (['bass', 'drums', 'arp'] as const).filter(id =>
            gates[id] && s - (since[id] ?? s) >= MUSIC.restAfter * 16 && id !== lastRest)
          if (ready.length) { rest = ready[Math.floor(rand() * ready.length)]; lastRest = rest }
        }
      }
      const sh = Math.round(MUSIC.slow.semis * depth)
      const notes: Note[] = []
      const play = (voice: Voice, n: string[], dur: string, vel = 1, semis = 0) => notes.push({ voice, notes: n, semis: semis + sh, dur, vel })
      let duck = false
      if (chordStart) play('pad', ch.pad, 'pad', 0.8)
      if (s16 % 2 === 0 && rest !== 'bass') { const i = s16 / 2; play('bass', [ch.bass], '16n', i % 2 ? 0.7 : 1, BASS[i]) }
      if (s16 % 4 === 0 && rest !== 'drums') {
        play('kick', ['C1'], '8n')
        duck = gates.drums
      }
      const fill = bar === 7 && s16 >= 13
      if ((s16 === 4 || s16 === 12 || fill) && rest !== 'drums') {
        play('snare', [], '16n', fill ? 0.4 + 0.2 * (s16 - 13) : 1)
        play('snareBody', ['G2'], '16n')
      }
      if (rest !== 'drums') {
        if (s16 % 4 === 2) play('hat', [], '32n', 0.9)
        else if (s16 % 2 === 1 && speed >= MUSIC.hats16From && mode === 'flying') play('hat', [], '32n', 0.35)
      }
      if (s16 % 2 === 0 && rest !== 'arp') { const i = s16 / 2; play('arp', [ch.arp[ARP[i]]], '8n', i % 2 ? 0.65 : 1) }
      if (gates.lead) {                          // the lead never rests; the melody is counted from its entry
        const pos = (s - leadSince) % (2 * HALF)
        if (pos === 0 && s !== leadSince) leadPass++
        const turn = MUSIC.leadTurns[leadPass % MUSIC.leadTurns.length]
        const tune = melodyAt[Math.floor(pos / HALF)].get(pos % HALF)
        if (tune) notes.push({ voice: 'lead', notes: [tune.note], semis: sh + turn.semis, dur: 'melody', vel: 0.9, len: tune.len, fx: turn.fx })
      }
      return { gates: changes, fades, notes, duck, rest }
    },
  }
}

/** A change to schedule: ramp `param` to `to` over `over` seconds, starting at `at` (seconds, the audio clock). */
export interface Ramp { param: 'bpm' | 'arpDelay' | 'leadHall' | 'leadEcho' | 'padCutoff' | 'master'; to: number; over: number; at: number }

/** How far a value must move before it is changed, and how fast it then ramps. */
export const CONTROL = { bpmStep: 0.5, cutoffStep: 0.03, ramp: 0.5, slowIn: 0.2, slowOut: 0.45 }

export interface ControlTracker {
  /** At the start of the loop, with the tempo set directly to `mode`'s. */
  reset(speed: number, mode?: Mode): void
  /** Each frame: what to change now. Usually nothing. */
  update(now: number, mode: Mode, speed: number): Ramp[]
  /** The ship destroyed: one tempo ramp down to the game-over screen's, over the music's fade. */
  gameOver(now: number): Ramp[]
  /** When slow motion starts: down and back up, scheduled at once. */
  slowMotion(now: number, mode: Mode, speed: number): Ramp[]
}

/**
 * Turns the game's speed and state into changes to the music, and only when
 * they have moved enough to hear. Tone.js keeps every change made to the tempo
 * for the whole session, so changing it on every frame would grow without end.
 */
export function createControlTracker(): ControlTracker {
  const applied = { bpm: 0, cut: 0 }
  let slowUntil = -1
  const baseBpm = (mode: Mode, speed: number) => controlFor(mode, speed, 0).bpm
  return {
    reset(speed, mode = 'flying') { applied.bpm = baseBpm(mode, speed); applied.cut = 0; slowUntil = -1 },
    update(now, mode, speed) {
      if (mode === 'silent' || now < slowUntil) return []      // slow motion has its own two ramps
      const ramps: Ramp[] = []
      const bpm = baseBpm(mode, speed)
      if (Math.abs(bpm - applied.bpm) >= CONTROL.bpmStep) {
        applied.bpm = bpm
        ramps.push(
          { param: 'bpm', to: bpm, over: CONTROL.ramp, at: now },
          { param: 'arpDelay', to: 60 / bpm * 0.75, over: CONTROL.ramp, at: now },   // a dotted eighth
          { param: 'leadHall', to: 60 / bpm * INSTRUMENTS.leadFx.hall.beats, over: CONTROL.ramp, at: now },
          { param: 'leadEcho', to: 60 / bpm * INSTRUMENTS.leadFx.echo.beats, over: CONTROL.ramp, at: now },
        )
      }
      const cut = controlFor(mode, speed, 0).padCutoff
      if (Math.abs(cut - applied.cut) / cut >= CONTROL.cutoffStep) {
        applied.cut = cut
        ramps.push({ param: 'padCutoff', to: cut, over: CONTROL.ramp, at: now })
      }
      return ramps
    },
    gameOver(now) {
      applied.bpm = MUSIC.over.bpm
      slowUntil = -1
      return [{ param: 'bpm', to: MUSIC.over.bpm, over: MUSIC.over.fade, at: now }]
    },
    slowMotion(now, mode, speed) {
      const bpm = baseBpm(mode, speed), back = now + SLOW_TIME - CONTROL.slowOut
      applied.bpm = bpm
      slowUntil = now + SLOW_TIME
      return [
        { param: 'bpm', to: bpm * MUSIC.slow.tempo, over: CONTROL.slowIn, at: now },
        { param: 'bpm', to: bpm, over: CONTROL.slowOut, at: back },
        { param: 'master', to: MUSIC.slow.cutoff, over: CONTROL.slowIn, at: now },
        { param: 'master', to: 18000, over: CONTROL.slowOut, at: back },
      ]
    },
  }
}
