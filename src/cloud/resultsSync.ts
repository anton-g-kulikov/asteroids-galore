import type { Records } from '../game/records'
import type { RunResult } from '../game/runSummary'
import type { BoardRow, RunEnd, SharedRun } from '../game/types'
import { callsignFor } from './callsign'
import { BOARD_SIZE, boardRows, type BoardEntry } from './leaderboard'

/** The few things the game needs from a backend. Implemented by firebaseBackend.ts. */
export interface CloudBackend {
  /** Signs the player in (anonymously) and resolves with their user ID. */
  signIn(): Promise<string>
  /** The player's saved best score and how that run ended, or null when nothing is saved yet. */
  loadBest(uid: string): Promise<{ best: number; end: RunEnd | null } | null>
  /** Saves the player's leaderboard entry: their best score and how that run ended, under their callsign. */
  saveBest(uid: string, best: number, end: RunEnd, callsign: string): Promise<void>
  /** Saves a finished run under the player's callsign and resolves with the new run's ID. */
  saveRun(uid: string, run: RunResult, callsign: string): Promise<string>
  /** A run by its ID, for a share link; null when there is no such run. */
  loadRun(runId: string): Promise<SharedRun | null>
  /** The `limit` highest entries of the board, best first. */
  loadBoard(limit: number): Promise<BoardEntry[]>
  /** How many players have a best score above `value`. */
  countAbove(value: number): Promise<number>
}

export interface ResultsSync {
  /** Settles once the first sign-in, the exchange of bests and the first board are over, whether or not they worked. */
  readonly ready: Promise<void>
  /**
   * Saves a finished run, and the best if the run improved it, then refreshes
   * the board. Resolves with the run's ID once it is saved (what a share link
   * needs), or null if saving failed. Never rejects.
   */
  submit(run: RunResult): Promise<string | null>
  /** The run behind a share link, or null if it cannot be had. Never rejects. */
  loadShared(runId: string): Promise<SharedRun | null>
}

export interface SyncOptions {
  log?: (message: string, error: unknown) => void
  /** Called with fresh rows for the board whenever it has been loaded. */
  onBoard?: (rows: BoardRow[]) => void
}

/**
 * Keeps the cloud in step with the game: signs in, evens out the best score in
 * both directions, saves each finished run, and fetches the leaderboard. The cloud
 * is never allowed to get in the way of playing, so every failure is logged
 * and swallowed.
 */
export function createResultsSync(backend: CloudBackend, records: Records, options: SyncOptions = {}): ResultsSync {
  const log = options.log ?? ((message, error) => console.warn(message, error))
  let uid: string | null = null
  let saved = 0   // the best the cloud is known to hold

  async function pushBest(id: string) {
    const now = records.best
    if (now <= saved) return
    await backend.saveBest(id, now, records.bestEnd, callsignFor(id))
    saved = now
  }

  async function signIn(): Promise<string> {
    if (uid) return uid
    const id = await backend.signIn()
    const remote = await backend.loadBest(id)
    if (remote?.best) { saved = remote.best; records.absorb(remote.best, remote.end) }
    uid = id
    return id
  }

  async function loadBoard(id: string) {
    const me = { uid: id, callsign: callsignFor(id), value: records.best, end: records.bestEnd }
    const [top, above] = await Promise.all([
      backend.loadBoard(BOARD_SIZE),
      me.value > 0 ? backend.countAbove(me.value) : 0,
    ])
    options.onBoard?.(boardRows(top, me, above))
  }

  // A board that will not load must not lose the run, so this has its own net.
  const refreshBoard = (id: string) =>
    loadBoard(id).catch(error => log('Loading the leaderboard failed', error))

  const ready = signIn()
    .then(async id => { await pushBest(id); await refreshBoard(id) })
    .catch(error => log('Cloud sign-in failed', error))

  return {
    ready,
    async submit(run) {
      try {
        await ready
        const id = await signIn()   // tries again if the first attempt failed
        const [runId] = await Promise.all([backend.saveRun(id, run, callsignFor(id)), pushBest(id)])
        void refreshBoard(id)   // the link is ready now; the board can follow
        return runId
      } catch (error) {
        log('Saving the run failed', error)
        return null
      }
    },
    async loadShared(runId) {
      try {
        return await backend.loadRun(runId)   // public: needs no sign-in
      } catch (error) {
        log('Loading the shared run failed', error)
        return null
      }
    },
  }
}
