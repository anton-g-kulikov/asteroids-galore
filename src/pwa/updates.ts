import type { GameState } from '../game/types'

/**
 * Applying an update reloads the page, so it is only allowed on the start
 * screen. Anywhere else it would cut short a run, the stop between missions,
 * or an end screen with its board and share link.
 */
export const updateAllowed = (state: GameState): boolean => state === 'menu'

export interface Updater {
  /** A new version of the game has been downloaded and is waiting. */
  found(): void
  /** Called every frame with the game's state; applies a waiting update when allowed. */
  tick(state: GameState): void
}

export function createUpdater(apply: () => void): Updater {
  let waiting = false
  return {
    found() { waiting = true },
    tick(state) {
      if (!waiting || !updateAllowed(state)) return
      waiting = false
      apply()
    },
  }
}
