import type { Game } from '../../game/types'
import type { StartEntriesView } from '../../story/view'
import { glow, text } from '../text'
import { BLUE, GREEN, inRect, type Rect } from './look'

/**
 * Where the start screen's two entries stand: ARCADE on the left, STORY on the right, where the
 * prompt was. With a shared run on the screen they move down with it, as the prompt does.
 */
export function startEntryRects(g: Game): { arcade: Rect; story: Rect } {
  const { W, H, U } = g
  const cy = g.shared ? Math.max(H * 0.58, H * 0.3 + (124 + 86) * U) : H * 0.58
  const w = 156 * U, h = 52 * U
  return { arcade: { x: W / 2 - 90 * U - w / 2, y: cy - h / 2, w, h }, story: { x: W / 2 + 90 * U - w / 2, y: cy - h / 2, w, h } }
}

/** The entry a tap at (x, y) lands on. A tap that misses both is nothing. */
export function startEntryAt(g: Game, x: number, y: number): 'arcade' | 'story' | null {
  const r = startEntryRects(g)
  return inRect(r.arcade, x, y) ? 'arcade' : inRect(r.story, x, y) ? 'story' : null
}

function drawEntry(ctx: CanvasRenderingContext2D, g: Game, r: Rect, label: string, color: string): void {
  const { U } = g
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = 2 * U; glow(ctx, color, 10 * U)
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2); ctx.stroke()
  ctx.restore()
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 6 * U, (label.length > 8 ? 14 : 17) * U, color, 'center', 800)
}

/** The two ways in: arcade in the HUD's blue, story in the green of a person aboard. */
export function drawStartEntries(ctx: CanvasRenderingContext2D, g: Game, v: StartEntriesView): void {
  const r = startEntryRects(g)
  drawEntry(ctx, g, r.arcade, 'ARCADE', BLUE)
  drawEntry(ctx, g, r.story, v.storyLabel, GREEN)
}
