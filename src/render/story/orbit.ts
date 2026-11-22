import type { Game } from '../../game/types'
import { glow } from '../text'
import { BLUE, GREEN, LINE, TAU, VIOLET } from './look'

/**
 * The route meter of a story flight: a slight arc at the foot of the field, the near side of the orbit
 * over the broken moon (the owner's choice, 2026-11-22). It shows that the boat flies in circles
 * (the owner: "we need to show that the ship flys an orbit"):
 * - the boat's mark sets out from the left end and eases to the top of the arc over the first lap,
 *   then stays there while the moon turns under it, its broken edge sliding away behind;
 * - no wormhole at the start; when one opens it comes over the far end, meets the mark just as it
 *   reaches the boat in the field, and if the boat flies past it goes on behind, fading.
 * It does not show where people are: nobody knows that in advance.
 */
export interface OrbitView {
  /** How far round this lap the boat is, 0 to 1. */
  at: number
  /** Laps already flown in this flight: one small pip each. */
  laps: number
  /** Mission 06: the captain is in the boat, and its mark is green. */
  captainAboard: boolean
}

/** How far the middle of the arc stands above its ends, in field units. */
export const ORBIT_RISE = 18
const MARGIN = 14, FOOT = 16, STEPS = 48
/** The gap between the end of the lit part and the boat, as part of the arc: about 10 field units. */
const BOAT_GAP = 0.028
/** The arc's own length, in field units. The visible arc is half the orbit, so the moon turns two arcs a lap. */
const ARC_LENGTH = 374
/** How much of each end fades, as things come over and go behind the horizon. */
const HORIZON = 0.09

/** The point of the arc at a place along it, 0 at the left end to 1 at the right end. */
export function orbitPoint(g: Game, t: number): { x: number; y: number } {
  const { W, H, U } = g
  const half = W / 2 - MARGIN, rise = ORBIT_RISE * U
  const radius = (half * half + rise * rise) / (2 * rise), a = Math.asin(half / radius) * (2 * t - 1)
  return { x: W / 2 + radius * Math.sin(a), y: H - FOOT * U - rise + radius * (1 - Math.cos(a)) }
}

/** Where the boat's mark stands on the arc: easing from the left end to the top over the first lap, then there. */
export function orbitBoatAt(v: Pick<OrbitView, 'at' | 'laps'>): number {
  if (v.laps > 0) return 0.5
  const k = Math.max(0, Math.min(1, v.at))
  return 0.5 * (1 - (1 - k) * (1 - k))
}

/**
 * Where the field's wormhole stands on the arc, and how brightly, or null with none. It comes over the far
 * end as it opens above the field and meets the boat's mark as it reaches the boat. Once passed it keeps
 * the same pace along the arc and fades as it goes behind, gone as it leaves the field.
 */
export function orbitWormholeAt(g: Game, boat: number): { t: number; alpha: number } | null {
  const w = g.wormhole
  if (!w) return null
  const ahead = g.ship.y - w.y
  const opened = g.ship.y + w.r + 30 * g.U, gone = g.H + 10 + w.r - g.ship.y
  const t = boat + (1 - boat) * Math.min(1, ahead / opened)
  return { t: Math.max(0, t), alpha: ahead >= 0 ? 1 : Math.max(0, 1 + ahead / gone) }
}

const horizon = (t: number): number => Math.max(0, Math.min(1, t / HORIZON, (1 - t) / HORIZON))

function path(ctx: CanvasRenderingContext2D, g: Game, from: number, to: number, down = 0): void {
  ctx.beginPath()
  for (let i = 0; i <= STEPS; i++) {
    const p = orbitPoint(g, from + (to - from) * i / STEPS)
    if (i) ctx.lineTo(p.x, p.y + down); else ctx.moveTo(p.x, p.y + down)
  }
}

/** A stroke that fades at both ends of the arc, over the horizon. */
function fading(ctx: CanvasRenderingContext2D, g: Game, colour: string): CanvasGradient {
  const { W } = g
  const fade = ctx.createLinearGradient(MARGIN, 0, W - MARGIN, 0)
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(HORIZON, colour)
  fade.addColorStop(1 - HORIZON, colour); fade.addColorStop(1, 'rgba(0,0,0,0)')
  return fade
}

/** The orbit, in place of arcade's straight bar. */
export function drawOrbit(ctx: CanvasRenderingContext2D, g: Game, v: OrbitView): void {
  const { W, H, U } = g
  const boat = orbitBoatAt(v)
  ctx.save()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  // the broken moon under the orbit, turning: its edge, in pieces, slides away behind the boat
  path(ctx, g, 0, 1, 9 * U); ctx.lineTo(W - MARGIN, H); ctx.lineTo(MARGIN, H); ctx.closePath()
  ctx.fillStyle = 'rgba(143,196,204,.07)'; ctx.fill()
  ctx.setLineDash([34, 6, 12, 5, 52, 7, 8, 9].map(n => n * U))
  ctx.lineDashOffset = (v.laps + v.at) * 2 * ARC_LENGTH * U
  path(ctx, g, 0, 1, 9 * U); ctx.strokeStyle = fading(ctx, g, 'rgba(143,196,204,.45)'); ctx.lineWidth = 1.4 * U; ctx.stroke()
  ctx.setLineDash([]); ctx.lineDashOffset = 0

  // the orbit, faint, and lit behind the boat as arcade's bar is
  ctx.lineWidth = 3 * U
  ctx.strokeStyle = fading(ctx, g, 'rgba(255,255,255,.2)'); path(ctx, g, 0, 1); ctx.stroke()
  if (boat - BOAT_GAP > 0) { ctx.strokeStyle = fading(ctx, g, BLUE); glow(ctx, BLUE, 5 * U); path(ctx, g, 0, boat - BOAT_GAP); ctx.stroke(); glow(ctx) }

  // laps already flown: one pip each, above where the arc begins
  const start = orbitPoint(g, 0)
  ctx.fillStyle = BLUE
  for (let i = 0; i < v.laps; i++) { ctx.beginPath(); ctx.arc(start.x + (2 + i * 8) * U, start.y - 11 * U, 2.4 * U, 0, TAU); ctx.fill() }

  // the wormhole, only while the field has one: coming over the far end, past the boat, away behind
  const worm = orbitWormholeAt(g, boat)
  if (worm) {
    const end = orbitPoint(g, worm.t)
    ctx.globalAlpha = horizon(worm.t) * worm.alpha
    ctx.beginPath(); ctx.arc(end.x, end.y, 5.5 * U, 0, TAU); ctx.fillStyle = '#000'; ctx.fill()
    ctx.strokeStyle = VIOLET; ctx.lineWidth = 2 * U; glow(ctx, VIOLET, 8 * U); ctx.stroke()
    ctx.beginPath(); ctx.arc(end.x, end.y, 1.6 * U, 0, TAU); ctx.fillStyle = VIOLET; ctx.fill(); glow(ctx)
    ctx.globalAlpha = 1
  }

  // the boat: an open chevron, ">", pointing the way it flies (the owner: "use only > shape, just not the
  // arrow"). In the ship's line of light, green with the captain aboard.
  const p = orbitPoint(g, boat), q = orbitPoint(g, boat + 0.004)
  ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(q.y - p.y, q.x - p.x))
  drawOrbitBoat(ctx, U, v.captainAboard ? GREEN : LINE)
  ctx.restore()
}

/** The boat on the arc: an open ">", 10 long and 12 across, pointing along +x, centred on the arc. */
export function drawOrbitBoat(ctx: CanvasRenderingContext2D, U: number, colour: string): void {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(-4 * U, -6 * U); ctx.lineTo(5 * U, 0); ctx.lineTo(-4 * U, 6 * U)
  ctx.strokeStyle = colour; ctx.lineWidth = 2.4 * U; glow(ctx, colour, 7 * U); ctx.stroke()
  glow(ctx)
}
