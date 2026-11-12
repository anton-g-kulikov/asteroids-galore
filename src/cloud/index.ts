import type { Records } from '../game/records'
import type { RunResult } from '../game/runSummary'
import type { BoardKind, BoardRow, SharedRun } from '../game/types'
import { readFirebaseConfig } from './config'

export interface Cloud {
  /**
   * Saves a finished run in the background. Resolves with the run's ID once it
   * is saved, or null if it could not be. Never rejects.
   */
  submit(run: RunResult): Promise<string | null>
  /** The run behind a share link, or null. Never rejects. */
  loadShared(runId: string): Promise<SharedRun | null>
}

/**
 * Connects the game to Firebase, or returns null when there is no config.
 * `onBoard` receives the leaderboard rows whenever they have been (re)loaded.
 * The SDK is loaded in the background so it never delays the first frame.
 */
export function startCloud(records: Records, onBoard: (kind: BoardKind, rows: BoardRow[]) => void): Cloud | null {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return null

  const sync = Promise.all([import('./firebaseBackend'), import('./resultsSync')])
    .then(([backend, results]) => results.createResultsSync(backend.createFirebaseBackend(config), records, { onBoard }))
    .catch(error => { console.warn('Cloud unavailable', error); return null })

  return {
    submit: run => sync.then(s => s?.submit(run) ?? null),
    loadShared: runId => sync.then(s => s?.loadShared(runId) ?? null),
  }
}
