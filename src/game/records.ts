// The player's best score, kept on the device.

/** Not the key of the old distance best, so an old distance is never read as a score. */
export const BEST_KEY = 'asteroids-galore-best-score'

export type RecordStore = Pick<Storage, 'getItem' | 'setItem'>

export interface Records {
  /** Highest score: parsecs flown times crew saved. */
  readonly best: number
  /** Returns true when the score beats the best. */
  saveBest(score: number): boolean
  /** Takes in a best saved elsewhere (the cloud): raises the local best if it is lower. */
  absorb(best: number): void
}

/** `store` is null when the browser offers no storage; the best then lasts for the visit only. */
export function createRecords(store: RecordStore | null): Records {
  let best = 0
  try {
    best = Number(store?.getItem(BEST_KEY)) || 0
  } catch { /* storage blocked: start from zero */ }

  const write = (value: number) => {
    try { store?.setItem(BEST_KEY, String(value)) } catch { /* storage blocked: keep it in memory */ }
  }

  return {
    get best() { return best },
    saveBest(score) {
      const final = Math.floor(score)
      if (final <= best) return false
      best = final
      write(best)
      return true
    },
    absorb(other) {
      if (other > best) { best = Math.floor(other); write(best) }
    },
  }
}
