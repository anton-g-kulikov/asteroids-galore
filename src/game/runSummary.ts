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
  durationSeconds: number
}

/** How the run ended: what the board shows beside its score. */
export const runEnd = (g: Game): RunEnd => ({
  outcome: g.state === 'won' ? 'won' : 'over',
  level: g.level,
  finalDistance: finalDistance(g),
})

export function runSummary(g: Game): RunResult {
  return {
    ...runEnd(g),
    score: scoreOf(g),
    distance: Math.floor(g.distance),
    saved: g.saved,
    lost: g.lost,
    missed: g.missed,
    durationSeconds: Math.round(g.time * 10) / 10,
  }
}
