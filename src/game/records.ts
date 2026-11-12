// The player's bests, kept on the device.

export const BEST_KEY = 'asteroids-galore-best'
export const BEST_CREW_KEY = 'asteroids-galore-best-crew'

export type RecordStore = Pick<Storage, 'getItem' | 'setItem'>

export interface Records {
  /** Longest distance, in whole parsecs. */
  readonly best: number
  /** Most crew brought home in a finished mission. */
  readonly bestCrew: number
  /** Returns true when the distance beats the best. */
  saveBest(score: number): boolean
  /** Returns true when the crew count beats the best. */
  saveBestCrew(rescued: number): boolean
  /** Takes in bests saved elsewhere (the cloud): raises each local best that is lower. */
  absorb(other: { best: number; bestCrew: number }): void
}

/** `store` is null when the browser offers no storage; bests then last for the visit only. */
export function createRecords(store: RecordStore | null): Records {
  let best = 0, bestCrew = 0
  try {
    best = Number(store?.getItem(BEST_KEY)) || 0
    bestCrew = Number(store?.getItem(BEST_CREW_KEY)) || 0
  } catch { /* storage blocked: start from zero */ }

  const write = (key: string, value: number) => {
    try { store?.setItem(key, String(value)) } catch { /* storage blocked: keep it in memory */ }
  }

  return {
    get best() { return best },
    get bestCrew() { return bestCrew },
    saveBest(score) {
      const final = Math.floor(score)
      if (final <= best) return false
      best = final
      write(BEST_KEY, best)
      return true
    },
    saveBestCrew(rescued) {
      if (rescued <= bestCrew) return false
      bestCrew = rescued
      write(BEST_CREW_KEY, bestCrew)
      return true
    },
    absorb(other) {
      if (other.best > best) { best = Math.floor(other.best); write(BEST_KEY, best) }
      if (other.bestCrew > bestCrew) { bestCrew = Math.floor(other.bestCrew); write(BEST_CREW_KEY, bestCrew) }
    },
  }
}
