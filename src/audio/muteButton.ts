import type { Game } from '../game/types'

// The mute control: a small speaker in the top right corner of the start
// screen and of the results screens between missions, and in the bottom right
// corner of the end screens (their top corners hold the leaderboard and share
// buttons), with no word. Drawn here rather than with the rest of the screen,
// so the drawing code does not need to know about sound. `M` on a keyboard
// toggles it anywhere.

/** Where the icon is, in play-field units; a tap anywhere in it toggles sound. */
export function muteButtonRect(g: Game): { x: number; y: number; w: number; h: number } {
  const { W, U } = g
  const size = Math.max(40, 44 * U)
  const y = isEnd(g) ? g.H - 14 - size : 44 * U + 8 - size / 2
  return { x: W - 14 - size, y, w: size, h: size }
}

const isEnd = (g: Game): boolean => g.state === 'over' || g.state === 'won'

/**
 * On every screen that waits for a tap: the start screen, between missions and
 * the end screens (not over the leaderboard). Not in flight or the fly-in,
 * where a tap steers. Only where the browser can play sound.
 */
export const showsMute = (g: Game, audio: boolean): boolean =>
  audio && (g.state === 'menu' || g.state === 'between' || (isEnd(g) && !g.boardOpen))

/**
 * True when a tap at (x, y), in play-field units, lands on the icon. Such a tap
 * is only a mute: it must not also start a run, choose a ship or move on.
 */
export function onMuteButton(g: Game, x: number, y: number, audio: boolean): boolean {
  if (!showsMute(g, audio)) return false
  const r = muteButtonRect(g)
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

export function drawMuteButton(ctx: CanvasRenderingContext2D, g: Game, muted: boolean): void {
  const { U } = g
  const r = muteButtonRect(g), cx = r.x + r.w / 2, cy = r.y + r.h / 2, s = 7 * U
  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.6 * U
  ctx.lineCap = 'round'
  // the speaker
  const x0 = cx - s * 1.4
  ctx.beginPath()
  ctx.moveTo(x0, cy - s * 0.45); ctx.lineTo(x0 + s * 0.6, cy - s * 0.45); ctx.lineTo(x0 + s * 1.3, cy - s)
  ctx.lineTo(x0 + s * 1.3, cy + s); ctx.lineTo(x0 + s * 0.6, cy + s * 0.45); ctx.lineTo(x0, cy + s * 0.45)
  ctx.closePath(); ctx.fill()
  if (muted) {
    // a cross where the waves would be
    const x = cx + s * 0.6
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, cy - s * 0.45); ctx.lineTo(x + s * 0.45, cy + s * 0.45)
    ctx.moveTo(x + s * 0.45, cy - s * 0.45); ctx.lineTo(x - s * 0.45, cy + s * 0.45); ctx.stroke()
  } else {
    for (const k of [0.75, 1.25]) {
      ctx.beginPath(); ctx.arc(cx, cy, s * k, -0.75, 0.75); ctx.stroke()
    }
  }
  ctx.restore()
}
