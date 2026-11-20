import type { SoundEvent } from '../game/events'
import { timeScale } from '../game/timeScale'
import type { Game } from '../game/types'
import { PULSE, cuesFor, type SoundName } from './sounds'
import type { Synth } from './synth'

export const MUTE_KEY = 'asteroids-galore-muted'

/** The audio output, made on the first tap or key; null where the browser has none. */
export interface Audio { synth: Synth; resume(): void; suspend(): void }

export interface PlayerDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  createAudio: () => Audio | null
}

export interface SoundPlayer {
  readonly muted: boolean
  /** Starts the audio. Browsers allow it only from a tap or a key, so call it from those. */
  unlock(): void
  toggleMute(): void
  /** The page was left (true) or came back (false). */
  setHidden(hidden: boolean): void
  /** Once a frame: plays what the simulation reported since the last frame, and the wormhole's pulse. */
  frame(g: Game, dt: number): void
  /** For trying sounds by ear: one sound, or what an event sounds like. */
  audition(what: SoundName | SoundEvent, pitch?: number): void
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

  const play = (e: SoundEvent, pitch: number, gain = 1) => {
    for (const c of cuesFor(e)) {
      if (c.stopOthers) audio!.synth.stopAll()
      audio!.synth.play(c.sound, { pitch: (c.pitch ?? 1) * pitch, gain: (c.gain ?? 1) * gain, delay: c.delay ?? 0, stretch: c.stretch })
    }
  }

  return {
    get muted() { return muted },
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
      if (muted) audio.synth.stopAll()
      else audio.synth.play('click', { pitch: 1, gain: 1, delay: 0 })   // the player hears that sound is on
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
      const pitch = g.state === 'play' && g.slowmo > 0 ? timeScale(g.slowmo) : 1
      for (const e of events) {
        play(e, pitch)
        if (e.kind === 'wormhole') pulseIn = PULSE.every
      }
      // A wormhole on the field pulses, louder as it comes down towards the ship.
      if (g.state === 'play' && g.wormhole) {
        pulseIn -= dt
        if (pulseIn <= 0) {
          const top = -g.wormhole.r, near = Math.max(0, Math.min(1, (g.wormhole.y - top) / (g.ship.y - top)))
          audio.synth.play('pulse', { pitch, gain: PULSE.quiet + (PULSE.loud - PULSE.quiet) * near, delay: 0 })
          pulseIn = PULSE.every
        }
      } else pulseIn = 0
    },
    audition(what, pitch = 1) {
      if (!audio) return
      if (typeof what === 'string') audio.synth.play(what, { pitch, gain: 1, delay: 0 })
      else play(what, pitch)
    },
    auditionPulse(near, pitch = 1) {
      audio?.synth.play('pulse', { pitch, gain: PULSE.quiet + (PULSE.loud - PULSE.quiet) * near, delay: 0 })
    },
  }
}
