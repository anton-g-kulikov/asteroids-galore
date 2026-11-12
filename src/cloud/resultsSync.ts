import type { Records } from '../game/records'
import type { RunResult } from '../game/runSummary'
import type { BoardRow, SharedRun } from '../game/types'
import { callsignFor } from './callsign'
import { BOARD_SIZE, boardRows, type BoardEntry, type BoardKind } from './leaderboard'

export interface Bests { best: number; bestCrew: number }

/** The few things the game needs from a backend. Implemented by firebaseBackend.ts. */
export interface CloudBackend {
  /** Signs the player in (anonymously) and resolves with their user ID. */
  signIn(): Promise<string>
  /** The player's saved bests, or null when nothing is saved yet. */
  loadBests(uid: string): Promise<Bests | null>
  /** Saves the player's leaderboard entry: their bests, under their callsign. */
  saveBests(uid: string, bests: Bests, callsign: string): Promise<void>
  /** Saves a finished run under the player's callsign and resolves with the new run's ID. */
  saveRun(uid: string, run: RunResult, callsign: string): Promise<string>
  /** A run by its ID, for a share link; null when there is no such run. */
  loadRun(runId: string): Promise<SharedRun | null>
  /** The `limit` highest entries of a board, best first. */
  loadBoard(kind: BoardKind, limit: number): Promise<BoardEntry[]>
  /** How many players have a best above `value` on a board. */
  countAbove(kind: BoardKind, value: number): Promise<number>
}

export interface ResultsSync {
  /** Settles once the first sign-in, the exchange of bests and the first boards are over, whether or not they worked. */
  readonly ready: Promise<void>
  /**
   * Saves a finished run, and the bests if the run improved them, then refreshes
   * the boards. Resolves with the run's ID once it is saved (what a share link
   * needs), or null if saving failed. Never rejects.
   */
  submit(run: RunResult): Promise<string | null>
  /** The run behind a share link, or null if it cannot be had. Never rejects. */
  loadShared(runId: string): Promise<SharedRun | null>
}

export interface SyncOptions {
  log?: (message: string, error: unknown) => void
  /** Called with fresh rows for a board whenever one has been loaded. */
  onBoard?: (kind: BoardKind, rows: BoardRow[]) => void
}

/**
 * Keeps the cloud in step with the game: signs in, evens out the bests in both
 * directions, saves each finished run, and fetches the leaderboards. The cloud
 * is never allowed to get in the way of playing, so every failure is logged
 * and swallowed.
 */
export function createResultsSync(backend: CloudBackend, records: Records, options: SyncOptions = {}): ResultsSync {
  const log = options.log ?? ((message, error) => console.warn(message, error))
  let uid: string | null = null
  let saved: Bests = { best: 0, bestCrew: 0 }   // what the cloud is known to hold

  const local = (): Bests => ({ best: records.best, bestCrew: records.bestCrew })

  async function pushBests(id: string) {
    const now = local()
    if (now.best <= saved.best && now.bestCrew <= saved.bestCrew) return
    await backend.saveBests(id, now, callsignFor(id))
    saved = now
  }

  async function signIn(): Promise<string> {
    if (uid) return uid
    const id = await backend.signIn()
    const remote = await backend.loadBests(id)
    if (remote) { saved = remote; records.absorb(remote) }
    uid = id
    return id
  }

  async function loadBoard(id: string, kind: BoardKind) {
    const me = { uid: id, callsign: callsignFor(id), value: kind === 'distance' ? records.best : records.bestCrew }
    const [top, above] = await Promise.all([
      backend.loadBoard(kind, BOARD_SIZE),
      me.value > 0 ? backend.countAbove(kind, me.value) : 0,
    ])
    options.onBoard?.(kind, boardRows(top, me, above))
  }

  // A board that will not load must not lose the run, so this has its own net.
  const refreshBoards = (id: string) =>
    Promise.all([loadBoard(id, 'distance'), loadBoard(id, 'crew')])
      .then(() => {}, error => log('Loading the leaderboard failed', error))

  const ready = signIn()
    .then(async id => { await pushBests(id); await refreshBoards(id) })
    .catch(error => log('Cloud sign-in failed', error))

  return {
    ready,
    async submit(run) {
      try {
        await ready
        const id = await signIn()   // tries again if the first attempt failed
        const [runId] = await Promise.all([backend.saveRun(id, run, callsignFor(id)), pushBests(id)])
        void refreshBoards(id)   // the link is ready now; the boards can follow
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
