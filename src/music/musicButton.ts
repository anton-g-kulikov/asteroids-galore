import { muteButtonRect, showsMute } from '../audio/muteButton'
import type { Game } from '../game/types'

// The music switch: a note just left of the sound-effects speaker, on the
// same screens. It is its own control: either can be off while the other plays.
// `N` on a keyboard toggles it anywhere.

export function musicButtonRect(g: Game): { x: number; y: number; w: number; h: number } {
  const m = muteButtonRect(g)
  return { x: m.x - m.w - 8, y: m.y, w: m.w, h: m.h }
}

export const showsMusicButton = (g: Game, audio: boolean): boolean => showsMute(g, audio)

/** True when a tap at (x, y), in play-field units, lands on the note: such a tap only toggles the music. */
export function onMusicButton(g: Game, x: number, y: number, audio: boolean): boolean {
  if (!showsMusicButton(g, audio)) return false
  const r = musicButtonRect(g)
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

/** An eighth note; crossed out when the music is off. */
export function drawMusicButton(ctx: CanvasRenderingContext2D, g: Game, on: boolean): void {
  const { U } = g
  const r = musicButtonRect(g), cx = r.x + r.w / 2, cy = r.y + r.h / 2, s = 7 * U
  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.6 * U
  ctx.lineCap = 'round'
  const hx = cx - s * 0.35, hy = cy + s * 0.7
  ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.5, s * 0.36, -0.4, 0, Math.PI * 2); ctx.fill()   // the head
  ctx.beginPath(); ctx.moveTo(hx + s * 0.46, hy - s * 0.1); ctx.lineTo(hx + s * 0.46, cy - s * 1.1)   // the stem
  ctx.lineTo(hx + s * 1.2, cy - s * 0.55); ctx.stroke()                                               // the flag
  if (!on) {
    ctx.beginPath(); ctx.moveTo(cx - s * 1.1, cy + s * 1.1); ctx.lineTo(cx + s * 1.1, cy - s * 1.1); ctx.stroke()
  }
  ctx.restore()
}
