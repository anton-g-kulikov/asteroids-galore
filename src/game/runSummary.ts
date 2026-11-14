import { scoreOf } from './score'
import type { Game } from './types'

/** What is kept of a run once it has ended. */
export interface RunResult {
  /** `won`: all levels cleared. `over`: ship destroyed. */
  outcome: 'won' | 'over'
  /** The missions' scores added up: see `missionScore`. Never below zero. */
  score: number
  /** Whole parsecs flown. */
  distance: number
  /** Level the run ended on. */
  level: number
  /** Crew delivered through a wormhole. */
  saved: number
  /** Crew who were on board when the ship was destroyed. Always 0 for a `won` run. */
  lost: number
  /** Crew who drifted past without being picked up. */
  missed: number
  durationSeconds: number
}

export function runSummary(g: Game): RunResult {
  return {
    outcome: g.state === 'won' ? 'won' : 'over',
    score: scoreOf(g),
    distance: Math.floor(g.distance),
    level: g.level,
    saved: g.saved,
    lost: g.lost,
    missed: g.missed,
    durationSeconds: Math.round(g.time * 10) / 10,
  }
}
