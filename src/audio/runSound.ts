// How well the sound held up over a run, saved with the run (the owner's word, 2026-11-23: the
// sound degraded slowly on a phone, and nothing said why). Read from the browser's own count of
// audio glitches: each time the audio thread missed its deadline the speaker got a gap
// (AudioContext.playbackStats, in recent Chrome; where a browser has none those figures are left out). Like the
// frame rate, it only reads; it changes nothing in the game or the sound.

/** The browser's running totals for an audio context; `underrunDuration` in seconds. */
export interface PlaybackStats { underrunEvents: number; underrunDuration: number }

export interface SoundSource {
  /** The audio context's glitch totals so far, or null where the browser does not count them (or before the sound has started). */
  stats(): PlaybackStats | null
  /** How many times the sound was found stopped by the phone and started again (see SoundPlayer.restarts). */
  restarts(): number
}

export interface RunSoundResult {
  /** Gaps in the sound during the run: the audio thread missed its deadline. */
  audioUnderruns?: number
  /** The gaps added up, in milliseconds. */
  audioUnderrunMs?: number
  /** Seconds into the run of the first gap; left out when there was none. */
  audioFirstUnderrun?: number
  /** Times the phone had stopped the sound and a tap started it again. */
  audioStops: number
}

export interface RunSound {
  /** A run has started: count from here. */
  start(): void
  /** Once per frame, with the real time since the frame before. Looks at the totals once a second. */
  frame(dt: number): void
  /** What the run's sound went through; null before any run. */
  result(): RunSoundResult | null
}

const whole = (n: number) => Math.max(0, Math.round(n))

export function createRunSound(source: SoundSource): RunSound {
  let started = false
  let from: PlaybackStats | null = null, restartsFrom = 0
  let time = 0, sinceLook = 0, first: number | null = null

  // a context that starts mid-run (the first tap) counts from when its totals first appear
  const look = () => {
    const s = source.stats()
    if (!s) return null
    if (!from) from = { ...s }
    if (first === null && s.underrunEvents > from.underrunEvents) first = time
    return s
  }

  return {
    start() {
      started = true
      from = null; time = 0; sinceLook = 0; first = null
      restartsFrom = source.restarts()
      look()
    },
    frame(dt) {
      if (!started || !(dt > 0)) return
      time += dt; sinceLook += dt
      if (sinceLook >= 1) { sinceLook = 0; look() }
    },
    result() {
      if (!started) return null
      const s = look()
      const out: RunSoundResult = { audioStops: whole(source.restarts() - restartsFrom) }
      if (s && from) {
        out.audioUnderruns = whole(s.underrunEvents - from.underrunEvents)
        out.audioUnderrunMs = whole((s.underrunDuration - from.underrunDuration) * 1000)
        if (first !== null) out.audioFirstUnderrun = whole(first)
      }
      return out
    },
  }
}
