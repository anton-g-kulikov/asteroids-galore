// What is kept of each story flight, saved in the cloud as `flights/{id}` (the owner's word, 2026-11-23:
// story flights save their frame rate and sound too). Not a run: no score, no board, no share link;
// it is there so slow frames and failing sound in story mode show up in the data. The story itself
// stays on the device (src/story/progress.ts).

import type { RunFps } from '../fps/runFrames'
import type { RunSoundResult } from '../audio/runSound'

/** How a flight went, as the story mode reports it when the flight ends. */
export interface StoryFlightEnd {
  /** The moon flown to, 0 for m00n to 6 for m06n. */
  moon: number
  /** The boat flown, 1 to 3. */
  boat: number
  /** A flight back to a moon already visited. */
  isReturn: boolean
  /** People brought out, or aboard when the boat was lost. */
  picked: number
  /** The boat was lost. */
  destroyed: boolean
  /** Laps of the orbit flown. */
  laps: number
  /** Dev mode was on: a test flight, maybe jumped to or ended from the dev panel. */
  dev: boolean
}

/** A flight as saved: how it went, how long it took, and how the screen and the sound held up. */
export type StoryFlightRecord = StoryFlightEnd & { durationSeconds: number } & Partial<RunFps> & Partial<RunSoundResult>
