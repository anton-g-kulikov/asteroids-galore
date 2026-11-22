import type { Game } from '../../game/types'
import { shipRadius } from '../../game/tuning'
import type { PickerView } from '../../story/view'
import { drawHull } from '../sprites'
import { glow, text } from '../text'
import { GREEN, LINE, type Rect } from './look'

export interface StoryCard extends Rect { ship: 1 | 2 | 3; lost: boolean }

/**
 * Where the story's boats stand: side by side, smallest on the left, each in its own share of the
 * width, a lost boat keeping its place. A hold anywhere in a boat's share of the width chooses it.
 */
export function storyCards(g: Game, v: PickerView): StoryCard[] {
  const { W, U } = g
  const share = W / Math.max(1, v.boats.length), w = Math.min(share - 10 * U, 150 * U), h = 112 * U
  return v.boats.map((b, i) => ({ ship: b.ship, lost: b.lost, x: share * (i + 0.5) - w / 2, y: 300 * U, w, h }))
}

/** The boat a touch at `x` holds, or null over a lost one. */
export function storyCardAt(g: Game, v: PickerView, x: number): 1 | 2 | 3 | null {
  if (!v.boats.length) return null
  const i = Math.min(v.boats.length - 1, Math.max(0, Math.floor(x / (g.W / v.boats.length))))
  return v.boats[i].lost ? null : v.boats[i].ship
}

/**
 * The boat picker in story: arcade's cards, with a lost boat as a broken outline in a dashed frame
 * and a bar that fills under the boat being held. Drawn over a story screen, under its transmissions.
 */
export function drawStoryPicker(ctx: CanvasRenderingContext2D, g: Game, v: PickerView): void {
  const { W, U } = g
  const cards = storyCards(g, v)
  if (!cards.length) return
  const big = Math.max(...cards.map(c => shipRadius(c.ship))) * U
  const scale = Math.min(1.6, (cards[0].w - 12 * U) / (2.3 * big), (cards[0].h - 24 * U) / (2.3 * big))
  for (const c of cards) {
    const held = v.held === c.ship
    ctx.save()
    ctx.strokeStyle = held ? '#ffffff' : 'rgba(255,255,255,.6)'
    ctx.lineWidth = (held ? 2.4 : 1.5) * U
    if (c.lost) { ctx.globalAlpha = 0.3; ctx.setLineDash([4 * U, 6 * U]) }
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 12 * U); ctx.stroke()
    ctx.restore()
    if (held && v.progress > 0) {
      ctx.save()
      ctx.strokeStyle = LINE; ctx.lineWidth = 4 * U; ctx.lineCap = 'round'; glow(ctx, LINE, 12 * U)
      ctx.beginPath(); ctx.moveTo(c.x + 12 * U, c.y + c.h + 12 * U)
      ctx.lineTo(c.x + 12 * U + (c.w - 24 * U) * Math.min(1, v.progress), c.y + c.h + 12 * U); ctx.stroke()
      ctx.restore()
    }
    const r = shipRadius(c.ship) * U * scale
    ctx.save()
    ctx.translate(c.x + c.w / 2, c.y + c.h - 14 * U - r * 0.95)
    // the boat the captain will fly lights its glass green while it is held
    drawHull(ctx, r, c.ship, 0, false, { lost: c.lost, glass: held && v.captainAboard ? GREEN : undefined })
    ctx.restore()
  }
  text(ctx, 'HOLD TO CHOOSE', W / 2, cards[0].y + cards[0].h + 58 * U, 11 * U, 'rgba(255,255,255,.55)', 'center', 700)
}
