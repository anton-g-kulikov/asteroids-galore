import type { Game } from '../game/types'
import { MUSIC, slowDepth, type Mode } from './score'

export const MUSIC_KEY = 'asteroids-galore-music'

/** What the conductor asks of the music. engine.ts makes it with Tone.js. */
export interface MusicEngine {
  /** Starts the loop from its first bar. */
  start(): void
  /** Fades the music out over `fade` seconds and stops the loop. */
  stop(fade: number): void
  /**
   * The ship destroyed: fades the music out over MUSIC.over.fade with the tempo ramping to
   * the game-over screen's, then plays that screen's bass alone until the loop is started again.
   */
  gameOver(): void
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
  /**
   * A tap on the note. On the start screen it starts the whole soundtrack, switching the
   * music on if it was off, and switches it off only once it is playing.
   * Elsewhere it toggles.
   */
  press(g: Game): void
  /** The music has loaded. Until then the game plays without it. */
  attach(engine: MusicEngine): void
  /**
   * Once a frame, before the sound effects take the events. `override` is story mode's screens
   * deciding the music (the pad, the end bass, or silence) in place of the game's state.
   */
  frame(g: Game, override?: Mode | null): void
  /** The chord the sound effects follow: the music's, or Am (0) when it is not loaded, switched off or not playing. */
  chord(): number
}

// The start screen plays every layer, at MUSIC.menuBpm, once the note has been tapped there.
const modeOf = (g: Game, menuMusic: boolean): Mode =>
  g.state === 'play' || g.state === 'launch' ? 'flying'
    : g.state === 'menu' && menuMusic ? 'menu'
    : g.state === 'between' ? 'results'
    : g.state === 'over' ? 'over'
    : 'silent'

/**
 * Follows the game for the music: silent on the start screen until the note
 * is tapped there, then the whole soundtrack; started by the fly-in of a run, the pad between missions, faded by a lost ship into the
 * game-over screen's bass (cut by the next run), stopped by the way home. It
 * only reads the game: its state, speed, slow motion and the events the
 * sound effects also hear.
 */
export function createConductor(storage: Pick<Storage, 'getItem' | 'setItem'> | null): Conductor {
  let on = true
  try { on = storage?.getItem(MUSIC_KEY) !== '0' } catch { /* storage blocked: on */ }
  let engine: MusicEngine | null = null
  let started = false
  let menuMusic = false                           // the note was tapped on the start screen: play it there
  let slowmo = 0                               // the game's slow motion last frame, to see it start
  let last: { mode: Mode; speed: number; depth: number; level: number } = { mode: 'silent', speed: 1, depth: 0, level: 1 }

  const follow = () => {
    if (!engine) return
    engine.set(last.mode, last.speed, last.depth, last.level)   // first, so a start knows what it starts
    if (last.mode !== 'silent' && !started) { engine.start(); started = true }
  }

  const toggle = () => {
    on = !on
    try { storage?.setItem(MUSIC_KEY, on ? '1' : '0') } catch { /* kept for this visit only */ }
    engine?.setOn(on)
  }

  return {
    get on() { return on },
    toggle,
    press(g) {
      if (g.state !== 'menu') return toggle()
      if (!on || menuMusic) toggle()
      menuMusic = true
    },
    chord: () => (engine && on && started ? engine.chord() : 0),
    attach(e) {
      engine = e
      engine.setOn(on)
      follow()
    },
    frame(g, override) {
      for (const e of g.events) {            // read, not taken: the sound effects use them too
        if (!engine) break
        if (e.kind === 'enter') engine.dropLayers(MUSIC.drop)
        if (e.kind === 'destroyed') engine.gameOver()
        if (e.kind === 'home') { engine.stop(MUSIC.stopHome); started = false }
      }
      const was = last.mode
      last = { mode: override ?? modeOf(g, menuMusic), speed: g.speed, depth: g.state === 'play' ? slowDepth(g.slowmo) : 0, level: g.level }
      if (override === 'over' && was !== 'over' && engine && started) engine.gameOver()       // story's manifest: the end bass
      if (override === 'silent' && was !== 'silent' && engine && started) engine.stop(MUSIC.stopHome)   // story's silences fade out
      if (last.mode === 'silent') started = false
      if (was === 'over' && last.mode !== 'over' && last.mode !== 'silent') started = false   // a new run (or a story screen) cuts the game-over bass and starts the loop again
      follow()
      // slow motion is passed on once, as it starts: the engine schedules it whole
      if (engine && started && g.state === 'play' && g.slowmo > slowmo + 1e-6) engine.slowMotion()
      slowmo = g.state === 'play' ? g.slowmo : 0
    },
  }
}
