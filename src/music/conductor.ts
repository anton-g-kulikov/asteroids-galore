import type { Game } from '../game/types'
import { MUSIC, slowDepth, type Mode } from './score'

export const MUSIC_KEY = 'asteroids-galore-music'

/** What the conductor asks of the music. engine.ts makes it with Tone.js. */
export interface MusicEngine {
  /** Starts the loop from its first bar. */
  start(): void
  /** Fades the music out over `fade` seconds and stops the loop. */
  stop(fade: number): void
  /** Takes every layer but the pad out over `fade` seconds. */
  dropLayers(fade: number): void
  /** Slow motion has just started: the engine schedules its two ramps at once. */
  slowMotion(): void
  /** The chord playing now: 0 Am, 1 F, 2 C, 3 G. */
  chord(): number
  /** The music switch. */
  setOn(on: boolean): void
  /**
   * Once a frame: what the game is doing, its speed, how deep the slow motion
   * is (0–1) and which mission it is. The engine changes the music only when these have moved enough to
   * hear (see createControlTracker); the depth only lowers new notes.
   */
  set(mode: Mode, speed: number, depth: number, level: number): void
}

export interface Conductor {
  readonly on: boolean
  toggle(): void
  /** The music has loaded. Until then the game plays without it. */
  attach(engine: MusicEngine): void
  /** Once a frame, before the sound effects take the events. */
  frame(g: Game): void
  /** The chord the sound effects follow: the music's, or Am (0) when it is not loaded, switched off or not playing. */
  chord(): number
}

const modeOf = (g: Game): Mode => g.state === 'play' ? 'flying' : g.state === 'between' ? 'results' : 'silent'

/**
 * Follows the game for the music: silent on the start screen, started by a
 * run, the pad between missions, stopped by a lost ship or the way home. It
 * only reads the game: its state, speed, slow motion and the events the
 * sound effects also hear.
 */
export function createConductor(storage: Pick<Storage, 'getItem' | 'setItem'> | null): Conductor {
  let on = true
  try { on = storage?.getItem(MUSIC_KEY) !== '0' } catch { /* storage blocked: on */ }
  let engine: MusicEngine | null = null
  let started = false
  let slowmo = 0                               // the game's slow motion last frame, to see it start
  let last: { mode: Mode; speed: number; depth: number; level: number } = { mode: 'silent', speed: 1, depth: 0, level: 1 }

  const follow = () => {
    if (!engine) return
    if (last.mode !== 'silent' && !started) { engine.start(); started = true }
    engine.set(last.mode, last.speed, last.depth, last.level)
  }

  return {
    get on() { return on },
    toggle() {
      on = !on
      try { storage?.setItem(MUSIC_KEY, on ? '1' : '0') } catch { /* kept for this visit only */ }
      engine?.setOn(on)
    },
    chord: () => (engine && on && started ? engine.chord() : 0),
    attach(e) {
      engine = e
      engine.setOn(on)
      follow()
    },
    frame(g) {
      for (const e of g.events) {            // read, not taken: the sound effects use them too
        if (!engine) break
        if (e.kind === 'enter') engine.dropLayers(MUSIC.drop)
        if (e.kind === 'destroyed') { engine.stop(MUSIC.stopOver); started = false }
        if (e.kind === 'home') { engine.stop(MUSIC.stopHome); started = false }
      }
      last = { mode: modeOf(g), speed: g.speed, depth: g.state === 'play' ? slowDepth(g.slowmo) : 0, level: g.level }
      if (last.mode === 'silent') started = false
      follow()
      // slow motion is passed on once, as it starts: the engine schedules it whole
      if (engine && started && g.state === 'play' && g.slowmo > slowmo + 1e-6) engine.slowMotion()
      slowmo = g.state === 'play' ? g.slowmo : 0
    },
  }
}
