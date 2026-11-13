// Sharing a finished run as a link: /s/{runId} opens the game with that run
// shown on the start screen.

import type { RunResult } from '../game/runSummary'

const SHARE_PATH = /^\/s\/([A-Za-z0-9_-]{6,64})\/?$/

/** The run ID in a share link's path, or null when the path is not a share link. */
export function shareIdFromPath(pathname: string): string | null {
  return SHARE_PATH.exec(pathname)?.[1] ?? null
}

export const shareUrl = (origin: string, runId: string): string => `${origin}/s/${runId}`

/** The line that goes with the link. It leads with the crew: they are what the score is for. */
export function shareMessage(run: RunResult): string {
  return run.outcome === 'won'
    ? `All missions complete in Asteroids Galore: ${run.saved} crew saved, score ${run.score.toLocaleString('en-US')}.`
    : `I saved ${run.saved} crew in Asteroids Galore and scored ${run.score.toLocaleString('en-US')}. Can you save more?`
}

/** The parts of `navigator` that sharing needs; either may be missing. */
export interface ShareTarget {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>
  clipboard?: { writeText(text: string): Promise<void> }
}

/**
 * Opens the share sheet, or copies the link where there is none.
 * Must be called from a tap, or the browser will refuse.
 */
export async function shareResult(target: ShareTarget, text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  if (target.share) {
    try {
      await target.share({ title: 'Asteroids Galore', text, url })
    } catch { /* the player closed the sheet: nothing to do */ }
    return 'shared'
  }
  try {
    if (!target.clipboard) return 'failed'
    await target.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
