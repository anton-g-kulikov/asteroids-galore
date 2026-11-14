import { LAST_LEVEL, MISS_COST } from './tuning'
import type { Game, LevelResult } from './types'

/** What the crew left behind cost, in whole per cent: MISS_COST each, and never more than everything. */
export const missedPercent = (missed: number): number => Math.min(100, Math.round(missed * MISS_COST * 100))

/** The share of a mission's score that is kept after the crew left behind. */
export const keptShare = (missed: number): number => 1 - missedPercent(missed) / 100

/**
 * A mission's score: the parsecs flown in it times the crew saved in it, less
 * the share the crew left behind cost. Parsecs only ever multiply the crew of
 * their own mission. A mission that ended with the ship destroyed saved nobody
 * and scores nothing; what earlier missions banked is untouched.
 */
export const missionScore = (r: LevelResult): number =>
  Math.round(r.distance * r.saved * keptShare(r.missed))

/** The run's score: its missions added up. */
export const runScore = (results: LevelResult[]): number =>
  results.reduce((sum, r) => sum + missionScore(r), 0)

export const scoreOf = (g: Game): number => runScore(g.results)

/** What the current mission has added to the run so far, apart from crew saved. */
export const missionSoFar = (g: Game): Omit<LevelResult, 'saved'> => ({
  level: g.level,
  missed: g.missed - g.levelFrom.missed,
  distance: Math.floor(g.distance) - Math.floor(g.levelFrom.distance),
})

/** What the crew on board would add if they were delivered now. */
export const pendingScore = (g: Game): number => missionScore({ ...missionSoFar(g), saved: g.onboard })

/** Whole parsecs flown in the last mission; 0 for a run that never reached it. */
export const finalDistance = (g: Game): number =>
  g.level >= LAST_LEVEL ? Math.floor(g.distance) - Math.floor(g.levelFrom.distance) : 0
