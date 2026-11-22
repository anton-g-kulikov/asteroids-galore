import type { Game } from '../../game/types'
import type { ManifestView, Mark } from '../../story/view'
import { glow, text } from '../text'
import { drawMark, type PersonMark } from './lantern'
import { BLUE, GOLD, MARK } from './look'

// How each fate is drawn: a disc for people who are somewhere, a ring for a place nobody filled or
// nobody can account for, a cross for the dead.
const FORM: Record<Mark, PersonMark> = { earth: 'aboard', left: 'left', dead: 'lost', anotherShip: 'away', missing: 'missing', onTheirWay: 'away', notReached: 'unreached' }

/**
 * The manifest, drawn over the backdrop at a story's ending: the captain, a row per moon the
 * captain was told about with one mark per person, the counts, a line for the cargo, and the
 * eight endings as lamps. A lit lamp carries its ending's name; an unlit one has none.
 */
export function drawManifest(ctx: CanvasRenderingContext2D, g: Game, v: ManifestView): void {
  const { W, U } = g
  text(ctx, 'THE MANIFEST', W / 2, 90 * U, 30 * U, BLUE, 'center', 800)
  // CAPTAIN or PILOT and the callsign; with no callsign, the one word alone (the heading comes made from src/story/manifest.ts)
  text(ctx, v.heading, W / 2, 114 * U, 13 * U, GOLD, 'center', 700)

  let y = 152 * U
  v.rows.forEach((row, i) => {
    if (i && row.moon !== v.rows[i - 1].moon + 1) {
      // moons the captain was never told about: three dots where their rows would be
      ctx.fillStyle = 'rgba(143,196,204,.5)'
      for (let k = 0; k < 3; k++) ctx.fillRect(44 * U, y - (9 - k * 6) * U, 2 * U, 2 * U)
      y += 18 * U
    }
    text(ctx, `m0${row.moon}n`, 30 * U, y + 4.5 * U, 13 * U, 'rgba(127,220,255,.9)', 'left', 700)
    row.marks.forEach((m, k) => drawMark(ctx, g, (92 + k * 14.4) * U, y, FORM[m]))
    y += 30 * U
  })

  const n = v.counts.length, cw = (W - 28 * U) / Math.max(1, n), cy = 410 * U
  v.counts.forEach((c, i) => {
    if (i >= v.countsShown) return   // the counts arrive one after another, each in the place it keeps
    const x = 14 * U + cw * (i + 0.5), color = MARK[c.mark]
    // five counts, as after "The commission", stand a little smaller so that all fit
    text(ctx, String(c.value), x, cy, (n > 4 ? 26 : n > 3 ? 30 : 34) * U, color, 'center', 800)
    // a long label breaks before its last word: BY ANOTHER / SHIP
    const words = c.label.split(' ')
    const lines = c.label.length > 12 && words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [c.label]
    lines.forEach((l, k) => text(ctx, l, x, cy + (20 + k * 13) * U, (n > 4 ? 9.5 : 10.5) * U, color, 'center', 700))
  })
  const paid = v.cargo.startsWith('COMMISSION PAID')
  text(ctx, v.cargo, W / 2, cy + 64 * U, 13 * U, paid ? GOLD : 'rgba(255,255,255,.6)', 'center', 700)

  v.lamps.forEach((lamp, i) => {
    const x = (i < 4 ? 30 : 212) * U, ly = (520 + (i % 4) * 24) * U
    ctx.save()
    ctx.translate(x, ly); ctx.rotate(Math.PI / 4)
    ctx.beginPath(); ctx.rect(-5 * U, -5 * U, 10 * U, 10 * U)
    if (lamp.lit) {
      ctx.fillStyle = GOLD; glow(ctx, GOLD, (lamp.justReached ? 14 : 5) * U)
      ctx.globalAlpha = lamp.justReached ? 1 : 0.55; ctx.fill()
    } else { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.2 * U; ctx.stroke() }
    ctx.restore()
    if (lamp.lit) text(ctx, lamp.name, x + 14 * U, ly + 4 * U, 11 * U, lamp.justReached ? GOLD : 'rgba(255,209,102,.6)', 'left', 700)
  })

  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.stateTime * 4)
  text(ctx, 'TAP TO CONTINUE', W / 2, 676 * U, 20 * U, '#ffffff')
  ctx.globalAlpha = 1
}
