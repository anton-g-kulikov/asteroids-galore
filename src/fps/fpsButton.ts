import { iconStyle, muteButtonRect } from '../audio/muteButton'
import type { Game } from '../game/types'
import { text } from '../render/text'
import type { FpsReading } from './meter'

// The frame-rate switch, a small gauge in the top left corner of the start
// screen that mirrors the mute speaker in the top right, and the reading it
// turns on. Both are drawn after the frame, so the drawing code does not change.

/** Where the gauge is, in play-field units: the speaker's row and size, mirrored. */
export function fpsButtonRect(g: Game): { x: number; y: number; w: number; h: number } {
  const m = muteButtonRect(g)
  return { x: g.W - (m.x + m.w), y: m.y, w: m.w, h: m.h }
}

export const showsFpsButton = (g: Game): boolean => g.state === 'menu'

/** True when a tap at (x, y), in play-field units, lands on the gauge: such a tap only toggles the switch. */
export function onFpsButton(g: Game, x: number, y: number): boolean {
  if (!showsFpsButton(g)) return false
  const r = fpsButtonRect(g)
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

/** A dial with a needle; brighter when the reading is on. */
export function drawFpsButton(ctx: CanvasRenderingContext2D, g: Game, on: boolean): void {
  const { U } = g
  const r = fpsButtonRect(g), cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 4 * U, s = 9 * U
  ctx.save()
  iconStyle(ctx, on)
  ctx.lineWidth = 1.6 * U
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(cx, cy, s, Math.PI, 0); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.55, cy - s * 0.65); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, 1.6 * U, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/** The star colour, at full strength. */
export const FPS_COLOUR = '#7fa8a2'

/** Where the reading sits: the left corner just above the progress bar, below the ship; in a story flight, above the orbit's left end. */
export const fpsReadingAt = (g: Game): { x: number; y: number } => ({ x: 14, y: g.H - (g.story && g.state === 'play' ? 36 : 22) * g.U })

/** For example `58 FPS · LOW 41`. Nothing until there is a reading. */
export function drawFpsReading(ctx: CanvasRenderingContext2D, g: Game, reading: FpsReading | null): void {
  if (!reading) return
  const { x, y } = fpsReadingAt(g)
  // in the star colour, so it reads as instrumentation and never as the white score
  text(ctx, `${reading.fps} FPS · LOW ${reading.low}`, x, y, 10 * g.U, FPS_COLOUR, 'left', 600)
}
