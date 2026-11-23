import type { Records } from '../game/records'
import type { RunResult } from '../game/runSummary'
import type { StoryFlightRecord } from '../story/flightRecord'
import type { BoardRow, SharedRun } from '../game/types'
import { readFirebaseConfig } from './config'

export interface Cloud {
  /**
   * Saves a finished run in the background. Resolves with the run's ID once it
   * is saved, or null if it could not be. Never rejects.
   */
  submit(run: RunResult): Promise<string | null>
  /** Saves the record of a story flight in the background; true once saved. Never rejects. */
  submitFlight(flight: StoryFlightRecord): Promise<boolean>
  /** The run behind a share link, or null. Never rejects. */
  loadShared(runId: string): Promise<SharedRun | null>
  /** The player's callsign once signed in, or null. Never rejects. */
  callsign(): Promise<string | null>
}

/**
 * Connects the game to Firebase, or returns null when there is no config.
 * `onBoard` receives the leaderboard rows whenever they have been (re)loaded.
 * The SDK is loaded in the background so it never delays the first frame.
 */
export function startCloud(records: Records, onBoard: (rows: BoardRow[]) => void): Cloud | null {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return null

  const sync = Promise.all([import('./firebaseBackend'), import('./resultsSync')])
    .then(([backend, results]) => results.createResultsSync(backend.createFirebaseBackend(config), records, { onBoard }))
    .catch(error => { console.warn('Cloud unavailable', error); return null })

  return {
    submit: run => sync.then(s => s?.submit(run) ?? null),
    submitFlight: flight => sync.then(s => s?.submitFlight(flight) ?? false),
    loadShared: runId => sync.then(s => s?.loadShared(runId) ?? null),
    callsign: () => sync.then(s => s?.callsign() ?? null),
  }
}
