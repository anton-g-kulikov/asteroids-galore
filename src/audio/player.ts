import { callPlan, channelClosePlan, chosenPlan, countPlan, lampPlan, ringRoot, ringSteps } from './storyScored'
import type { StoryEvent } from '../story/controller'
import type { SoundEvent } from '../game/events'
import { timeScale } from '../game/timeScale'
import type { Game } from '../game/types'
import { MUSIC, slowDepth } from '../music/score'
import { scoredFor, scoredPulse, type FxPlan } from './scored'
import { PULSE, cuesFor, type SoundName } from './sounds'
import type { Synth } from './synth'

export const MUTE_KEY = 'asteroids-galore-muted'

/** The audio output, made on the first tap or key; null where the browser has none. */
export interface Audio { synth: Synth; resume(): void; suspend(): void; /** The browser's audio context, shared with the music. */ context?: AudioContext }

/** The v2 sound effects, played by Tone.js once it has loaded (src/music/effects.ts). */
export interface EffectsOut {
  play(plan: FxPlan): void
  stopAll(): void
  /** Story screens: the open channel while a transmission types (a faint one breaks up). */
  channel?(open: boolean, faint: boolean): void
  /** Story screens: the ring filling, a swell on `root` and the arpeggio climbing over `seconds`; null lets go. */
  ring?(start: { root: number; steps: { midi: number; share: number; vel: number }[]; seconds: number } | null): void
}

export interface PlayerDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  createAudio: () => Audio | null
}

export interface SoundPlayer {
  readonly muted: boolean
  /** The audio context once the first tap or key has started it; the music plays through it too. */
  readonly context: AudioContext | null
  /** Starts the audio. Browsers allow it only from a tap or a key, so call it from those. */
  unlock(): void
  toggleMute(): void
  /** The page was left (true) or came back (false). */
  setHidden(hidden: boolean): void
  /** Once a frame: plays what the simulation reported since the last frame, and the wormhole's pulse. */
  frame(g: Game, dt: number): void
  /**
   * From now on play the sound effects on the soundtrack's instruments (v2),
   * on the chord `chordNow` reports. Until this is called they play as before.
   */
  attachEffects(fx: EffectsOut, chordNow: () => number): void
  /** For trying sounds by ear: one sound, or what an event sounds like. */
  audition(what: SoundName | SoundEvent, pitch?: number): void
  /** A story screen's moment (see storyScored.ts): only with the soundtrack's instruments loaded, and not when muted. */
  story(e: StoryEvent, holdSeconds: number): void
  /** The wormhole's pulse at a given loudness, 0–1, from far to near. */
  auditionPulse(near: number, pitch?: number): void
}

/**
 * Turns the simulation's events into sound. It only reads the game: the
 * events list, the slow motion and where the wormhole is. Nothing it does
 * goes back into the simulation.
 */
export function createSoundPlayer(deps: PlayerDeps): SoundPlayer {
  let muted = false
  try { muted = deps.storage?.getItem(MUTE_KEY) === '1' } catch { /* storage blocked: sound on */ }
  let audio: Audio | null = null, started = false
  let pulseIn = 0
  let fx: EffectsOut | null = null, chordNow = () => 0

  const play = (e: SoundEvent, pitch: number, gain = 1) => {
    for (const c of cuesFor(e)) {
      if (c.stopOthers) audio!.synth.stopAll()
      audio!.synth.play(c.sound, { pitch: (c.pitch ?? 1) * pitch, gain: (c.gain ?? 1) * gain, delay: c.delay ?? 0, stretch: c.stretch })
    }
  }

  return {
    get muted() { return muted },
    get context() { return audio?.context ?? null },
    unlock() {
      if (started) return
      started = true
      audio = deps.createAudio()
      audio?.resume()
    },
    toggleMute() {
      muted = !muted
      try { deps.storage?.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* kept for this visit only */ }
      if (!audio) return
      if (muted) { audio.synth.stopAll(); fx?.stopAll() }
      else if (fx) fx.play(scoredFor({ kind: 'choice', ship: 1 }, chordNow(), 0))   // the player hears that sound is on
      else audio.synth.play('click', { pitch: 1, gain: 1, delay: 0 })
    },
    setHidden(hidden) {
      if (!audio) return
      if (hidden) audio.suspend()
      else if (!muted) audio.resume()
    },
    frame(g, dt) {
      const events = g.events.splice(0)
      if (!audio || muted) return
      // Slow motion: whatever starts playing during it is lower, by the game's time scale.
      const slow = g.state === 'play' && g.slowmo > 0
      const pitch = slow ? timeScale(g.slowmo) : 1
      // v2 stays in tune with the music: whole semitones, as the music drops them
      const semis = slow ? Math.round(MUSIC.slow.semis * slowDepth(g.slowmo)) : 0
      for (let i = 0; i < events.length; i++) {
        const e = events[i]
        // v2: a crew member thrown off by a hit is marked by the hit's chord alone
        if (fx && e.kind === 'missed' && events[i - 1]?.kind === 'hit') continue
        if (fx) fx.play(scoredFor(e, chordNow(), semis))
        else play(e, pitch)
        if (e.kind === 'wormhole') pulseIn = PULSE.every
      }
      // A wormhole on the field pulses, louder as it comes down towards the ship.
      if (g.state === 'play' && g.wormhole) {
        pulseIn -= dt
        if (pulseIn <= 0) {
          const top = -g.wormhole.r, near = Math.max(0, Math.min(1, (g.wormhole.y - top) / (g.ship.y - top)))
          const gain = PULSE.quiet + (PULSE.loud - PULSE.quiet) * near
          if (fx) fx.play(scoredPulse(gain, chordNow(), semis))
          else audio.synth.play('pulse', { pitch, gain, delay: 0 })
          pulseIn = PULSE.every
        }
      } else pulseIn = 0
    },
    attachEffects(effects, chord) { fx = effects; chordNow = chord },
    audition(what, pitch = 1) {
      if (!audio) return
      if (typeof what === 'string') audio.synth.play(what, { pitch, gain: 1, delay: 0 })
      else play(what, pitch)
    },
    story(e, holdSeconds) {
      if (!fx || !audio || muted) return
      const chord = chordNow()
      switch (e.kind) {
        case 'call': fx.play(callPlan(e.voice, chord)); fx.channel?.(true, e.voice === 'foreman'); break
        case 'typingDone': fx.channel?.(false, false); fx.play(channelClosePlan()); break
        case 'holdStart': fx.ring?.({ root: ringRoot(chord), steps: ringSteps(chord), seconds: holdSeconds }); break
        case 'holdCancel': fx.ring?.(null); break
        case 'chosen': fx.ring?.(null); fx.play(chosenPlan(e.heavy, chord)); break
        case 'count': fx.play(countPlan(e.mark, chord)); break
        case 'lamp': fx.play(lampPlan(chord)); break
      }
    },
    auditionPulse(near, pitch = 1) {
      audio?.synth.play('pulse', { pitch, gain: PULSE.quiet + (PULSE.loud - PULSE.quiet) * near, delay: 0 })
    },
  }
}
