import { finalDistance, scoreOf } from './score'
import type { Game, RunEnd } from './types'

/** What is kept of a run once it has ended. */
export interface RunResult extends RunEnd {
  /** The missions' scores added up: see `missionScore`. */
  score: number
  /** Whole parsecs flown. */
  distance: number
  /** Crew delivered through a wormhole. */
  saved: number
  /** Crew who were on board when the ship was destroyed. Always 0 for a `won` run. */
  lost: number
  /** Crew who drifted past without being picked up. */
  missed: number
  /** The ship each mission was flown in, in order; the unfinished one included. The choices are inputs: with the seed they say what was played. */
  ships: number[]
  durationSeconds: number
  /** Frames the screen drew per second in flight: the average, and the slowest whole second. Added by the page (src/fps/runFrames.ts), not the simulation. */
  fpsAvg?: number
  fpsLow?: number
}

/** How the run ended: what the board shows beside its score. */
export const runEnd = (g: Game): RunEnd => ({
  outcome: g.state === 'won' ? 'won' : 'over',
  level: g.level,
  finalDistance: finalDistance(g),
  ship: g.shipType,
})

export function runSummary(g: Game): RunResult {
  return {
    ...runEnd(g),
    score: scoreOf(g),
    distance: Math.floor(g.distance),
    saved: g.saved,
    lost: g.lost,
    missed: g.missed,
    ships: g.results.map(r => r.ship),
    durationSeconds: Math.round(g.time * 10) / 10,
  }
}
