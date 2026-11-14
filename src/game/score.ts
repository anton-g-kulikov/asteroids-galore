import { MISS_PERCENT } from './tuning'
import type { Game, LevelResult } from './types'

/** The share of a mission's score that is kept, in per cent, after the crew left behind. */
export const keptPercent = (missed: number): number => Math.max(0, 100 - MISS_PERCENT * missed)

/**
 * A mission's score: the parsecs flown in it times the crew saved in it, less
 * MISS_PERCENT for every crew member left behind. Parsecs only ever multiply
 * the crew of their own mission, so lingering on an easy one buys little, and
 * the crews that drift past meanwhile eat into it.
 *
 * A mission that ended with the ship destroyed saved nobody: it costs its
 * distance times the crew who went down with the ship.
 */
export const missionScore = (r: LevelResult): number =>
  r.lost ? -(r.distance * r.lost) : Math.floor(r.distance * r.saved * keptPercent(r.missed) / 100)

/** The run's score: its missions added up, never below zero. */
export const runScore = (results: LevelResult[]): number =>
  Math.max(0, results.reduce((sum, r) => sum + missionScore(r), 0))

export const scoreOf = (g: Game): number => runScore(g.results)

/** What the current mission has added to the run so far, apart from crew saved. */
export const missionSoFar = (g: Game): Omit<LevelResult, 'saved'> => ({
  level: g.level,
  missed: g.missed - g.levelFrom.missed,
  distance: Math.floor(g.distance) - Math.floor(g.levelFrom.distance),
})

/** What the crew on board would add if they were delivered now. */
export const pendingScore = (g: Game): number => missionScore({ ...missionSoFar(g), saved: g.onboard })
