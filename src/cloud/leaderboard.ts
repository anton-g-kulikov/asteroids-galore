import type { BoardRow, RunEnd } from '../game/types'

/** How many players the board lists before the player's own row. */
export const BOARD_SIZE = 10

/** One player's entry on the board, as the backend returns it. `value` is their best score, `end` how that run ended. */
export interface BoardEntry { uid: string; callsign: string; value: number; end: RunEnd | null }

/**
 * Turns the top entries from the server into the rows to draw.
 *
 * The server's copy of the player's own entry can be a run behind, so `me`
 * (with the best the game holds right now) replaces it. If that leaves the
 * player outside the top `limit`, their row is added last; `above` is how many
 * players the server says are ahead of them.
 */
export function boardRows(top: BoardEntry[], me: BoardEntry, above: number, limit = BOARD_SIZE): BoardRow[] {
  const entries = top.filter(e => e.uid !== me.uid && e.value > 0)
  if (me.value > 0) {
    const ahead = entries.filter(e => e.value >= me.value).length   // on a tie, whoever got there first stays ahead
    entries.splice(ahead, 0, me)
  }
  const rows = entries.slice(0, limit).map((e, i) => ({ rank: i + 1, callsign: e.callsign, value: e.value, me: e === me, end: e.end }))
  if (me.value > 0 && !rows.some(r => r.me)) {
    rows.push({ rank: Math.max(above + 1, limit + 1), callsign: me.callsign, value: me.value, me: true, end: me.end })
  }
  return rows
}
