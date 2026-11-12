import type { Game } from './types'

/** What is kept of a run once it has ended. */
export interface RunResult {
  /** `won`: all levels cleared. `over`: out of lives. */
  outcome: 'won' | 'over'
  /** Whole parsecs flown. */
  distance: number
  /** Level the run ended on. */
  level: number
  /** Crew picked up. They only got home if the outcome is `won`. */
  rescued: number
  missed: number
  durationSeconds: number
}

export function runSummary(g: Game): RunResult {
  return {
    outcome: g.state === 'won' ? 'won' : 'over',
    distance: Math.floor(g.score),
    level: g.level,
    rescued: g.rescued,
    missed: g.missed,
    durationSeconds: Math.round(g.time * 10) / 10,
  }
}
