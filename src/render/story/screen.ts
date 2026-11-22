import type { Game } from '../../game/types'
import type { ChainView, ChoiceView, StoryScreenView, TransmissionView } from '../../story/view'
import { glow, outlined, text } from '../text'
import { drawLantern, drawMark, LANTERN_HEIGHT } from './lantern'
import { GREEN, LINE, ORANGE, PALE, SUIT, TAU, VOICE } from './look'

/** Text of a transmission starts here; its line of light stands at `BAR_X`. */
const TEXT_X = 30, BAR_X = 18
/** A line of a transmission: 14 px, 21 apart; 34 between transmissions. A line holds 42 characters. */
const LINE_SIZE = 14, LINE_STEP = 21, GAP = 34

/**
 * The chain of moons the captain has been told about, centred on `y`. Moons next to each other
 * stand 24 apart on a solid line; a stretch not yet named is a longer, broken line with no circles,
 * so the chain says something lies between without saying how much. The moon in play is lit.
 */
export function drawChain(ctx: CanvasRenderingContext2D, g: Game, v: ChainView, y: number): void {
  const { W, U } = g
  const xs: number[] = []
  let x = 0
  v.named.forEach((m, i) => { if (i) x += (m === v.named[i - 1] + 1 ? 24 : 44) * U; xs.push(x) })
  const x0 = W / 2 - x / 2
  ctx.save()
  ctx.lineWidth = U
  v.named.forEach((m, i) => {
    if (!i) return
    const gap = m !== v.named[i - 1] + 1
    ctx.strokeStyle = `rgba(143,196,204,${gap ? 0.35 : 0.5})`
    ctx.setLineDash(gap ? [2 * U, 5 * U] : [])
    ctx.beginPath(); ctx.moveTo(x0 + xs[i - 1], y); ctx.lineTo(x0 + xs[i], y); ctx.stroke()
  })
  ctx.setLineDash([])
  v.named.forEach((m, i) => {
    const lit = m === v.current
    ctx.beginPath(); ctx.arc(x0 + xs[i], y, (lit ? 6 : 4.5) * U, 0, TAU)
    ctx.fillStyle = '#000000'; ctx.fill()
    if (lit) { ctx.fillStyle = LINE; glow(ctx, LINE, 12 * U); ctx.fill(); glow(ctx) }
    else {
      // moons already left are dimmer than moons still ahead
      ctx.strokeStyle = v.current !== null && m < v.current ? 'rgba(143,196,204,.55)' : PALE
      ctx.lineWidth = 1.3 * U; ctx.stroke()
    }
  })
  ctx.restore()
}

/** The characters of a transmission's lines, all together. */
export const transmissionLength = (t: Pick<TransmissionView, 'lines'>): number => t.lines.reduce((n, l) => n + l.length, 0)

/**
 * One transmission with its sender on `y`: the sender in the voice's colour, the lines typed so far
 * beside a line of light in the same colour. Returns the y of the next transmission's sender.
 */
export function drawTransmission(ctx: CanvasRenderingContext2D, g: Game, t: TransmissionView, y: number): number {
  const { U } = g
  const color = VOICE[t.voice], step = LINE_STEP * U
  ctx.save()
  if (t.faint) ctx.globalAlpha = 0.6
  text(ctx, t.sender, TEXT_X, y, 12 * U, color, 'left', 700)
  if (t.faint) {
    // a weak signal: three bars after the name, one lit
    const sw = ctx.measureText(t.sender).width
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = color; ctx.globalAlpha = i ? 0.2 : 0.7
      ctx.fillRect(TEXT_X + sw + (10 + i * 5) * U, y - (3 + i * 3) * U, 3 * U, (3 + i * 3) * U)
    }
    ctx.globalAlpha = 0.6
  }
  ctx.strokeStyle = color; ctx.lineWidth = 2 * U; glow(ctx, color, 8 * U)
  if (t.faint) ctx.setLineDash([3 * U, 5 * U])
  ctx.beginPath(); ctx.moveTo(BAR_X, y - 10 * U); ctx.lineTo(BAR_X, y + t.lines.length * step + 4 * U); ctx.stroke()
  glow(ctx); ctx.setLineDash([])
  let left = t.typed
  t.lines.forEach((l, i) => {
    if (left <= 0) return
    const shown = left < l.length ? l.slice(0, left) + '▌' : l   // a block where the typing has got to
    left -= l.length
    text(ctx, shown, TEXT_X, y + (i + 1) * step, LINE_SIZE * U, t.faint ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.92)', 'left', 600)
  })
  ctx.restore()
  return y + t.lines.length * step + GAP * U
}

/** Where the two circles of a choice stand: at the same places as the start screen's hold hints. */
const sideX = (g: Game, side: 'left' | 'right'): number => g.W / 2 + (side === 'left' ? -1 : 1) * g.W * 0.3

/** The side of the field a touch at `x` holds. A choice is held anywhere on its half, as the ship is steered. */
export const choiceSideAt = (g: Game, x: number): 'left' | 'right' => x < g.W / 2 ? 'left' : 'right'

// One side of a choice: the hold hint's circle and arrow, its two lines of words, and the ring that fills while it is held.
function drawSide(ctx: CanvasRenderingContext2D, g: Game, v: ChoiceView, side: 'left' | 'right', y: number): void {
  const { U } = g
  const x = sideX(g, side), dir = side === 'left' ? -1 : 1, s = 18 * U
  const mine = v.held === side, other = v.held !== null && !mine
  ctx.save()
  ctx.globalAlpha = other ? 0.2 : mine ? 1 : 0.7
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * U
  ctx.beginPath(); ctx.arc(x, y, 34 * U, 0, TAU); ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.moveTo(x + dir * s, y); ctx.lineTo(x - dir * s * 0.6, y - s); ctx.lineTo(x - dir * s * 0.6, y + s); ctx.closePath(); ctx.fill()
  ctx.restore()
  if (mine && v.progress > 0) {
    ctx.save()
    ctx.strokeStyle = LINE; ctx.lineWidth = 5 * U; ctx.lineCap = 'round'; glow(ctx, LINE, 12 * U)
    ctx.beginPath(); ctx.arc(x, y, 41 * U, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, v.progress)); ctx.stroke()
    ctx.restore()
  }
  const words = side === 'left' ? v.left : v.right
  words.forEach((l, k) => text(ctx, l, x, y + (62 + k * 19) * U, 14 * U, `rgba(255,255,255,${other ? 0.3 : 0.95})`, 'center', 800))
}

/** A choice, with its circles centred on `y`: held, not tapped. */
export function drawChoice(ctx: CanvasRenderingContext2D, g: Game, v: ChoiceView, y: number): void {
  text(ctx, 'HOLD TO CHOOSE', g.W / 2, y - 56 * g.U, 11 * g.U, 'rgba(255,255,255,.55)', 'center', 700)
  drawSide(ctx, g, v, 'left', y)
  drawSide(ctx, g, v, 'right', y)
}

/**
 * A story screen, drawn over the backdrop: the chain and the title, then either the stop after a
 * trip (the moon's people, the *Lantern*, the counts) or the transmissions, with the *Lantern*
 * under them on the two choices that can end the story; and at the foot a choice or the prompt.
 */
export function drawStoryScreen(ctx: CanvasRenderingContext2D, g: Game, v: StoryScreenView): void {
  const { W, U } = g
  // the head sits higher on the screens that also carry the *Lantern*
  const chainY = (v.ending ? 52 : v.lantern ? 44 : 58) * U
  drawChain(ctx, g, v.chain, chainY)
  if (v.ending) outlined(ctx, v.title, W / 2, 112 * U, Math.min(40, 600 / Math.max(1, v.title.length)) * U)   // a long name is drawn smaller
  else outlined(ctx, v.title, W / 2, chainY + 50 * U, 30 * U)

  let footY = 580 * U
  if (v.people) {
    // the stop after a trip: one mark per person of this moon, the ship, and three lines of count
    const { aboard, still, lost } = v.people, n = aboard + still + lost, step = Math.min(13, 340 / Math.max(1, n)) * U
    const x0 = W / 2 - (n - 1) * step / 2
    for (let i = 0; i < n; i++) drawMark(ctx, g, x0 + i * step, 128 * U, i < aboard ? 'aboard' : i < aboard + still ? 'still' : 'lost')
    if (v.lantern) drawLantern(ctx, g, v.lantern, W / 2 - 22 * U, 156 * U)
  } else {
    let y = (v.lantern ? 142 : 172) * U
    for (const t of v.transmissions) y = drawTransmission(ctx, g, t, y)
    if (v.lantern) {
      const top = y - (GAP - 14) * U
      drawLantern(ctx, g, v.lantern, W / 2 - 22 * U, top)
      footY = Math.min(580 * U, top + (LANTERN_HEIGHT + 114) * U)
    }
  }
  if (v.counts) {
    const c = v.counts
    text(ctx, `ON THE LANTERN ${c.lantern}/${c.room}`, W / 2, 392 * U, 15 * U, GREEN, 'center', 700)
    text(ctx, `STILL ON ${c.moon} ${c.still}`, W / 2, 416 * U, 15 * U, SUIT, 'center', 700)
    text(ctx, `LOST ${c.lost}`, W / 2, 440 * U, 15 * U, ORANGE, 'center', 700)
  }
  if (v.choice) drawChoice(ctx, g, v.choice, footY)
  else if (v.tapToContinue) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
    text(ctx, 'TAP TO CONTINUE', W / 2, 630 * U, 20 * U, '#ffffff')
    ctx.globalAlpha = 1
  }
}
