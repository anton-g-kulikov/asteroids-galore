import type { Game } from '../../game/types'
import type { LanternView } from '../../story/view'
import { drawHull, drawPerson } from '../sprites'
import { glow } from '../text'
import { BLUE, GREEN, LINE, ORANGE, PALE, TAU, VIOLET } from './look'

/** How tall the *Lantern* is drawn, nose to stern, in field units. */
export const LANTERN_HEIGHT = 198
/** Every place the *Lantern* has once the ore is dropped. */
export const LANTERN_PLACES = 70

/** The marks people are counted with: aboard, still on the moon, lost, left behind, missing. */
export type PersonMark = 'aboard' | 'still' | 'lost' | 'left' | 'missing' | 'away' | 'unreached'

/** One person, as a mark `r` across, centred on (x, y). Form as well as colour tells them apart. */
export function drawMark(ctx: CanvasRenderingContext2D, g: Game, x: number, y: number, kind: PersonMark, r = 4 * g.U): void {
  const { U } = g
  ctx.save()
  if (kind === 'aboard' || kind === 'away') {
    const col = kind === 'aboard' ? GREEN : BLUE
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; glow(ctx, col, 6 * U); ctx.fill()
  } else if (kind === 'still') {
    ctx.translate(x, y + r + U); drawPerson(ctx, r * 0.72, U, 0.3)
  } else if (kind === 'left' || kind === 'missing' || kind === 'unreached') {
    // a ring: left behind in pale, missing in green, and in violet the people the second freighter did not reach
    ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, TAU)
    ctx.strokeStyle = kind === 'left' ? PALE : kind === 'missing' ? GREEN : VIOLET; ctx.lineWidth = (kind === 'left' ? 1.1 : 1.7) * U; ctx.stroke()
  } else {
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.8 * U; ctx.lineCap = 'round'; glow(ctx, ORANGE, 6 * U)
    ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.8); ctx.lineTo(x + r * 0.8, y + r * 0.8)
    ctx.moveTo(x + r * 0.8, y - r * 0.8); ctx.lineTo(x - r * 0.8, y + r * 0.8); ctx.stroke()
  }
  glow(ctx)
  ctx.restore()
}

/**
 * The *Lantern* from above, nose up, its hull centred on `cx` with the nose at `top`: its places in
 * rows of seven, filled in green from the stern; the ore as blue diamonds in the places past its
 * room; and its three boats on a rail to the right, a lost one as a broken outline.
 */
export function drawLantern(ctx: CanvasRenderingContext2D, g: Game, v: LanternView, cx: number, top: number): void {
  const { U } = g
  ctx.save()
  ctx.translate(cx, top)
  ctx.scale(U, U)
  ctx.beginPath()
  ctx.moveTo(0, 0); ctx.quadraticCurveTo(52, 12, 52, 50); ctx.lineTo(52, 186); ctx.lineTo(34, 198)
  ctx.lineTo(-34, 198); ctx.lineTo(-52, 186); ctx.lineTo(-52, 50); ctx.quadraticCurveTo(-52, 12, 0, 0)
  ctx.fillStyle = '#000000'; ctx.fill()
  ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.lineJoin = 'round'; glow(ctx, LINE, 10 * U); ctx.stroke(); glow(ctx)
  // the bridge, where the captain is
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.quadraticCurveTo(15, 15, 19, 30); ctx.quadraticCurveTo(0, 39, -19, 30); ctx.quadraticCurveTo(-15, 15, 0, 9)
  ctx.fillStyle = LINE; ctx.fill()
  for (let i = 0; i < LANTERN_PLACES; i++) {
    const x = (i % 7 - 3) * 12.6, y = 178 - Math.floor(i / 7) * 13
    if (i < v.aboard) {
      ctx.beginPath(); ctx.arc(x, y, 4.2, 0, TAU); ctx.fillStyle = GREEN; glow(ctx, GREEN, 6 * U); ctx.fill(); glow(ctx)
    } else if (v.oreAboard && i >= v.room) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4)
      ctx.fillStyle = BLUE; ctx.globalAlpha = 0.85; glow(ctx, BLUE, 5 * U); ctx.fillRect(-3.4, -3.4, 6.8, 6.8)
      ctx.restore()
    } else {
      ctx.beginPath(); ctx.arc(x, y, 3.3, 0, TAU); ctx.strokeStyle = PALE; ctx.lineWidth = 1; ctx.stroke()
    }
  }
  // the rail, and at each of its three places a boat or the trace of one
  ctx.strokeStyle = 'rgba(143,196,204,.6)'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(74, 46); ctx.lineTo(74, 190)
  for (const y of [74, 122, 170]) { ctx.moveTo(52, y); ctx.lineTo(74, y) }
  ctx.stroke()
  ;[[74, 8.5], [122, 10.5], [170, 12]].forEach(([y, r], i) => {
    const state = v.boats[i]
    ctx.save(); ctx.translate(96, y)
    drawHull(ctx, r, i + 1, 0, false, { lost: state === 'lost' })
    ctx.restore()
  })
  ctx.restore()
}
