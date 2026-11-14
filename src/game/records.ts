// The player's best score, and how that run ended, kept on the device.

import type { RunEnd } from './types'

/** Not a key of any earlier best: scores under earlier rules are not comparable and are never read. */
export const BEST_KEY = 'asteroids-galore-best-v2'
export const BEST_END_KEY = 'asteroids-galore-best-v2-end'

export type RecordStore = Pick<Storage, 'getItem' | 'setItem'>

const NO_END: RunEnd = { outcome: 'over', level: 1, finalDistance: 0 }

export interface Records {
  /** Highest score. */
  readonly best: number
  /** How the run with the highest score ended. */
  readonly bestEnd: RunEnd
  /** Returns true when the score beats the best. */
  saveBest(score: number, end: RunEnd): boolean
  /** Takes in a best saved elsewhere (the cloud): raises the local best if it is lower. */
  absorb(best: number, end: RunEnd | null): void
}

function readEnd(raw: string | null | undefined): RunEnd {
  try {
    const v = JSON.parse(raw ?? '')
    if ((v.outcome === 'won' || v.outcome === 'over') && Number.isInteger(v.level) && Number.isInteger(v.finalDistance)) {
      return { outcome: v.outcome, level: v.level, finalDistance: v.finalDistance }
    }
  } catch { /* missing or damaged: fall through */ }
  return NO_END
}

/** `store` is null when the browser offers no storage; the best then lasts for the visit only. */
export function createRecords(store: RecordStore | null): Records {
  let best = 0, bestEnd = NO_END
  try {
    best = Number(store?.getItem(BEST_KEY)) || 0
    bestEnd = readEnd(store?.getItem(BEST_END_KEY))
  } catch { /* storage blocked: start from zero */ }

  const set = (value: number, end: RunEnd) => {
    best = value; bestEnd = end
    try {
      store?.setItem(BEST_KEY, String(value))
      store?.setItem(BEST_END_KEY, JSON.stringify(end))
    } catch { /* storage blocked: keep it in memory */ }
  }

  return {
    get best() { return best },
    get bestEnd() { return bestEnd },
    saveBest(score, end) {
      const final = Math.floor(score)
      if (final <= best) return false
      set(final, end)
      return true
    },
    absorb(other, end) {
      if (other > best) set(Math.floor(other), end ?? NO_END)
    },
  }
}
